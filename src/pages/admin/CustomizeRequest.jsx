// src/pages/admin/CustomizeRequest.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import emailjs from "@emailjs/browser";

const CATEGORY_LABELS = {
  wood: "Wood Sculptures",
  stone: "Stone Art",
  furniture: "Furniture",
};

const REJECTION_REASONS = [
  "We don't have the required material for this request.",
  "We are unable to fulfill this request within your desired timeframe.",
  "The requested dimensions are outside our production capacity.",
  "The design complexity is beyond what we are currently able to execute.",
];

const fmtNum = (n) => Number(n || 0);

const EMPTY_REJECT_MODAL = {
  open: false,
  request: null,
  selectedReason: "",
  customReason: "",
};

export default function CustomizeRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [rejectModal, setRejectModal] = useState(EMPTY_REJECT_MODAL);
  const [search, setSearch] = useState("");

  const sendDecisionEmail = async ({
    to,
    status,
    category,
    rejectionReason,
  }) => {
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const productLabel =
      CATEGORY_LABELS[category] || category || "your product";

    const subject =
      status === "accepted"
        ? "Your customization request is accepted ✅"
        : "Update on your customization request";

    const reasonLine = rejectionReason ? `\n\nReason: ${rejectionReason}` : "";

    const message =
      status === "accepted"
        ? `Thank you for your request. Your request is accepted. We will contact you soon. Thank you.\n\nProduct Category: ${productLabel}`
        : `Thank you for your request. Unfortunately, we cannot fulfill your request at this time.${reasonLine}\n\nWe hope we can help you in the future. Thank you for your understanding.\n\nProduct Category: ${productLabel}`;

    const templateParams = {
      to_email: to,
      subject,
      message,
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  };

  useEffect(() => {
    const q = query(
      collection(db, "customizationRequests"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this customization request?");
    if (!ok) return;

    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await deleteDoc(doc(db, "customizationRequests", id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete request");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const updateStatus = async (reqDoc, status, rejectionReason = "") => {
    const id = reqDoc.id;
    setBusy((b) => ({ ...b, [id]: true }));

    try {
      // 1) update Firestore
      const update = { status };
      if (status === "rejected" && rejectionReason) {
        update.rejectionReason = rejectionReason;
      }
      await updateDoc(doc(db, "customizationRequests", id), update);

      // 2) send email (only if email exists)
      const to = reqDoc.email || reqDoc.userEmail;
      if (to) {
        await sendDecisionEmail({
          to,
          status,
          category: reqDoc.category || "",
          rejectionReason: status === "rejected" ? rejectionReason : "",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update / email");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const statusBadge = (status = "pending") => {
    const styles = {
      pending: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || styles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const categoryLabel = (CATEGORY_LABELS[r.category] || r.category || "").toLowerCase();
      return (
        categoryLabel.includes(q) ||
        (r.userEmail || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.status || "pending").toLowerCase().includes(q) ||
        (r.details || "").toLowerCase().includes(q)
      );
    });
  }, [requests, search]);

  const total = useMemo(() => requests.length, [requests]);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Customization Requests</h2>
          <p className="text-sm text-gray-500">
            Review and accept/reject customer customization requests.
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {filtered.length}{filtered.length !== total ? ` / ${total}` : ""} request{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by category, email, phone, status, details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      {loading && <p className="text-gray-500">Loading requests...</p>}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-3 text-left whitespace-nowrap">Category</th>
                <th className="py-3 text-left whitespace-nowrap">Customer</th>
                <th className="py-3 text-left whitespace-nowrap">Contact</th>
                <th className="py-3 text-left whitespace-nowrap">Size (cm)</th>
                <th className="py-3 text-left whitespace-nowrap">Duration</th>
                <th className="py-3 text-left">Details</th>
                <th className="py-3 text-left whitespace-nowrap">Image</th>
                <th className="py-3 text-left whitespace-nowrap">Date</th>
                <th className="py-3 text-left whitespace-nowrap">Status</th>
                <th className="py-3 text-left whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const pending = (r.status || "pending") === "pending";
                const isBusy = !!busy[r.id];
                const s = r.size || {};

                // ✅ you saved: { height, width, length }
                const H = fmtNum(s.height);
                const W = fmtNum(s.width);
                const L = fmtNum(s.length);

                return (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-4 pr-4 align-top">
                      <div className="font-semibold">
                        {CATEGORY_LABELS[r.category] || r.category || "-"}
                      </div>
                    </td>

                    <td className="py-4 pr-4 align-top">
                      <div className="text-gray-800">
                        {r.userEmail || "Guest"}
                      </div>
                      {r.userId ? (
                        <div className="text-xs text-gray-400"></div>
                      ) : null}
                    </td>

                    {/* ✅ Email + phone */}
                    <td className="py-4 pr-4 align-top">
                      <div className="text-gray-800">{r.email || "-"}</div>
                      <div className="text-xs text-gray-400">
                        {r.phone || "-"}
                      </div>
                    </td>

                    <td className="py-4 pr-4 align-top text-gray-700 whitespace-nowrap">
                      {W}×{L}×{H}
                    </td>

                    <td className="py-4 pr-4 align-top text-gray-700 whitespace-nowrap">
                      {r.duration || "-"}
                    </td>

                    <td className="py-4 pr-4 align-top max-w-sm">
                      <div className="text-gray-700 line-clamp-3">
                        {r.details || "-"}
                      </div>
                    </td>

                    <td className="py-4 pr-4 align-top">
                      {r.imageUrl ? (
                        <a
                          href={r.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-700 underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>

                    <td className="py-4 pr-4 align-top whitespace-nowrap">
                      {r.createdAt?.toDate
                        ? r.createdAt.toDate().toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-4 pr-4 align-top">
                      {statusBadge(r.status)}
                    </td>

                    <td className="py-4 align-top">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(r.id)}
                          className={`px-3 py-1 rounded font-semibold ${
                            !isBusy
                              ? "bg-gray-900 text-white hover:bg-black"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isBusy ? "..." : "Delete"}
                        </button>

                        <button
                          type="button"
                          disabled={!pending || isBusy}
                          onClick={() => updateStatus(r, "accepted")}
                          className={`px-3 py-1 rounded font-semibold ${
                            pending && !isBusy
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isBusy ? "..." : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={!pending || isBusy}
                          onClick={() =>
                            setRejectModal({
                              open: true,
                              request: r,
                              selectedReason: "",
                              customReason: "",
                            })
                          }
                          className={`px-3 py-1 rounded font-semibold ${
                            pending && !isBusy
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isBusy ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-400">
                    {search ? "No requests match your search." : "No customization requests yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold mb-1">Reject Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a reason or write your own. The customer will see this in
              the email and on their request.
            </p>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                    rejectModal.selectedReason === reason
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    className="mt-0.5 accent-red-600"
                    checked={rejectModal.selectedReason === reason}
                    onChange={() =>
                      setRejectModal((prev) => ({
                        ...prev,
                        selectedReason: reason,
                        customReason: "",
                      }))
                    }
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}

              {/* Custom reason option */}
              <label
                className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                  rejectModal.selectedReason === "__custom__"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  className="mt-0.5 accent-red-600"
                  checked={rejectModal.selectedReason === "__custom__"}
                  onChange={() =>
                    setRejectModal((prev) => ({
                      ...prev,
                      selectedReason: "__custom__",
                    }))
                  }
                />
                <span className="text-sm text-gray-700">
                  Other (write your own reason)
                </span>
              </label>

              {rejectModal.selectedReason === "__custom__" && (
                <textarea
                  rows={3}
                  placeholder="Write a reason for the customer..."
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-200"
                  value={rejectModal.customReason}
                  onChange={(e) =>
                    setRejectModal((prev) => ({
                      ...prev,
                      customReason: e.target.value,
                    }))
                  }
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModal(EMPTY_REJECT_MODAL)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !rejectModal.selectedReason ||
                  (rejectModal.selectedReason === "__custom__" &&
                    !rejectModal.customReason.trim())
                }
                onClick={async () => {
                  const reason =
                    rejectModal.selectedReason === "__custom__"
                      ? rejectModal.customReason.trim()
                      : rejectModal.selectedReason;
                  setRejectModal(EMPTY_REJECT_MODAL);
                  await updateStatus(rejectModal.request, "rejected", reason);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
