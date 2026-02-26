// src/pages/admin/CustomizeRequest.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
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

// Post-acceptance pipeline statuses
const PROGRESS_OPTIONS = [
  { value: "accepted",    label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "shipping",    label: "Shipping" },
  { value: "completed",   label: "Completed" },
];

const PROGRESS_STYLES = {
  pending:     "bg-yellow-100 text-yellow-700",
  accepted:    "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  shipping:    "bg-indigo-100 text-indigo-700",
  completed:   "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-700",
};

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
  const [showArchived, setShowArchived] = useState(false);

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
    const reasonLine = rejectionReason ? `\n\nReason: ${rejectionReason}` : "";

    const EMAIL_CONTENT = {
      accepted: {
        subject: "Your customization request is accepted ✅",
        message: `Thank you for your request. Your request has been accepted. We will contact you soon.\n\nProduct Category: ${productLabel}`,
      },
      in_progress: {
        subject: "Your customization is being crafted 🔨",
        message: `Great news! We have started working on your customization request.\n\nProduct Category: ${productLabel}\n\nWe will notify you once it is ready to ship.`,
      },
      shipping: {
        subject: "Your customization request has been shipped 🚚",
        message: `Your custom ${productLabel} is on its way! It has been packed and shipped.\n\nYou will receive it shortly. Thank you for your patience!`,
      },
      completed: {
        subject: "Your customization request is complete 🎉",
        message: `Your custom ${productLabel} has been delivered and marked as complete.\n\nWe hope you love it! Feel free to reach out if you have any questions.\n\nThank you for choosing us!`,
      },
      rejected: {
        subject: "Update on your customization request",
        message: `Thank you for your request. Unfortunately, we cannot fulfill your request at this time.${reasonLine}\n\nWe hope we can help you in the future. Thank you for your understanding.\n\nProduct Category: ${productLabel}`,
      },
    };

    const content = EMAIL_CONTENT[status];
    if (!content) return;

    return emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { to_email: to, subject: content.subject, message: content.message },
      PUBLIC_KEY,
    );
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

  const handleArchive = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await updateDoc(doc(db, "customizationRequests", id), { archived: true });
    } catch (err) {
      console.error(err);
      alert("Failed to archive request");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const handleUnarchive = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await updateDoc(doc(db, "customizationRequests", id), { archived: false });
    } catch (err) {
      console.error(err);
      alert("Failed to unarchive request");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeliveryDateChange = async (id, dateStr) => {
    try {
      await updateDoc(doc(db, "customizationRequests", id), { estimatedDelivery: dateStr });
    } catch (err) {
      console.error(err);
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

  const STATUS_DISPLAY = {
    pending:     "Pending",
    accepted:    "Accepted",
    in_progress: "In Progress",
    shipping:    "Shipping",
    completed:   "Completed",
    rejected:    "Rejected",
  };

  const statusBadge = (status = "pending") => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        PROGRESS_STYLES[status] || PROGRESS_STYLES.pending
      }`}
    >
      {STATUS_DISPLAY[status] || status}
    </span>
  );

  const filtered = useMemo(() => {
    const pool = requests.filter((r) => !!r.archived === showArchived);
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((r) => {
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
  }, [requests, search, showArchived]);

  const activeCount = useMemo(() => requests.filter((r) => !r.archived).length, [requests]);
  const archivedCount = useMemo(() => requests.filter((r) => !!r.archived).length, [requests]);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Customization Requests</h2>
          <p className="text-sm text-gray-500">
            Review and accept/reject customer customization requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {filtered.length} {showArchived ? "archived" : "active"} request{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => { setShowArchived((v) => !v); setSearch(""); }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              showArchived
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {showArchived ? "View Active" : `Archived (${archivedCount})`}
          </button>
        </div>
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
                const status = r.status || "pending";
                const PIPELINE = ["accepted", "in_progress", "shipping", "completed"];
                const inPipeline = PIPELINE.includes(status);
                const canAccept = !inPipeline && status !== "accepted";
                const canReject = !inPipeline && status !== "rejected";
                const showProgress = ["accepted", "in_progress", "shipping"].includes(status);
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
                        {!showArchived && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleArchive(r.id)}
                            className={`px-3 py-1 rounded font-semibold ${
                              !isBusy
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isBusy ? "..." : "Archive"}
                          </button>
                        )}

                        {showArchived && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUnarchive(r.id)}
                            className={`px-3 py-1 rounded font-semibold ${
                              !isBusy
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isBusy ? "..." : "Unarchive"}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!canAccept || isBusy}
                          onClick={() => updateStatus(r, "accepted")}
                          className={`px-3 py-1 rounded font-semibold ${
                            canAccept && !isBusy
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isBusy ? "..." : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={!canReject || isBusy}
                          onClick={() =>
                            setRejectModal({
                              open: true,
                              request: r,
                              selectedReason: "",
                              customReason: "",
                            })
                          }
                          className={`px-3 py-1 rounded font-semibold ${
                            canReject && !isBusy
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isBusy ? "..." : "Reject"}
                        </button>

                        {showProgress && (
                          <select
                            value={status}
                            disabled={isBusy}
                            onChange={(e) => updateStatus(r, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${
                              PROGRESS_STYLES[status] || PROGRESS_STYLES.accepted
                            } ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {PROGRESS_OPTIONS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {showProgress && (
                        <div className="mt-2">
                          <label className="text-xs text-gray-400 block mb-0.5">
                            Est. delivery
                          </label>
                          <input
                            type="date"
                            value={r.estimatedDelivery || ""}
                            onChange={(e) =>
                              handleDeliveryDateChange(r.id, e.target.value)
                            }
                            className="text-xs border rounded px-1.5 py-1 w-36"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-400">
                    {search
                      ? "No requests match your search."
                      : showArchived
                        ? "No archived requests."
                        : "No customization requests yet"}
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
