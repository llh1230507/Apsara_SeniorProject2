// src/pages/admin/ReturnRequests.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, functions } from "../../firebase";
import { httpsCallable } from "firebase/functions";
import emailjs from "@emailjs/browser";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function ReturnRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState({});

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "returnRequests"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load return requests:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Send email for different steps: approval, refund confirmation, rejection
  const sendEmail = (request, type = "approval", note = "") => {
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const email = request.customer?.email;
    if (!email || !SERVICE_ID) return;

    let subject = "";
    let message = "";
    if (type === "approval") {
      subject = "Your return request has been approved ✅";
      message = `Hi ${request.customer?.fullName || "there"},\n\nYour return request for order #${request.orderId} has been approved.\n\nRefund amount: $${formatMoney(request.refundAmount)} (after 15% restocking fee).\n\nBefore we can process your refund, please return the product to our designated address. Once we receive and inspect the returned item, we will proceed with your refund.\n\n${
        request.paymentMethod === "cod"
          ? "Since you paid with Cash on Delivery, please reply to this email with your bank account details or your preferred refund method (bank transfer, mobile wallet, etc.) so we can process your refund."
          : "Since you paid by card, the refund will be processed to your original card within 5–10 business days. If you do not see the refund after this period, please contact your bank or card provider for assistance."
      }
\n\nThank you for your patience!`;
    } else if (type === "refund") {
      subject = "Your refund has been processed 💸";
      message = `Hi ${request.customer?.fullName || "there"},\n\nWe have received and inspected your returned product for order #${request.orderId}.\n\nYour refund of $${formatMoney(request.refundAmount)} has been issued to your original payment method.\n\nDepending on your bank or card provider, it may take 5–10 business days for the refund to appear. If you do not see the refund after this period, please contact your bank or card provider for assistance.\n\nThank you for shopping with us!`;
    } else if (type === "rejection") {
      subject = "Your return request has been reviewed";
      message = `Hi ${request.customer?.fullName || "there"},\n\nYour return request for order #${request.orderId} has been reviewed.\n\nUnfortunately, we are unable to process your return at this time.\n${note ? `\nReason: ${note}\n` : ""}\nIf you have any questions, please contact our support team.\n\nThank you for your understanding.`;
    }

    emailjs
      .send(
        SERVICE_ID,
        TEMPLATE_ID,
        { to_email: email, subject, message },
        PUBLIC_KEY,
      )
      .catch((err) => console.error("Email failed:", err));
  };

  const refundStripePayment = httpsCallable(functions, "refundStripePayment");
  // New: two-step approval
  const handleApprove = async (req) => {
    if (
      !window.confirm(
        `Approve return for order ${req.orderId}? Instruct customer to ship product first. Refund will be issued after you confirm receipt.`,
      )
    )
      return;
    setProcessing(req.id);
    try {
      // Step 1: Mark as 'awaiting_return' and send instructions
      await updateDoc(doc(db, "returnRequests", req.id), {
        status: "awaiting_return",
        reviewedAt: serverTimestamp(),
        adminNote: "Return instructions sent. Awaiting product.",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "awaiting_return",
                adminNote: "Return instructions sent. Awaiting product.",
              }
            : r,
        ),
      );
      sendEmail(req, "approval");
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to send return instructions.");
    } finally {
      setProcessing(null);
    }
  };

  // New: confirm receipt and issue refund
  const handleConfirmReceived = async (req) => {
    if (
      !window.confirm(
        `Confirm product received for order ${req.orderId}? Issue refund now?`,
      )
    )
      return;
    setProcessing(req.id);
    try {
      // Stripe refund logic
      if (req.paymentMethod === "stripe" && req.paymentIntentId) {
        const result = await refundStripePayment({
          paymentIntentId: req.paymentIntentId,
          amount: req.refundAmount,
        });
        if (!result.data.success) {
          alert("Stripe refund failed: " + result.data.error);
          setProcessing(null);
          return;
        }
      }
      await updateDoc(doc(db, "returnRequests", req.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        adminNote: "Product received. Refund issued.",
      });
      await updateDoc(doc(db, "orders", req.orderId), {
        status: "returned",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "approved",
                adminNote: "Product received. Refund issued.",
              }
            : r,
        ),
      );
      sendEmail(req, "refund");
    } catch (err) {
      console.error("Failed to confirm receipt/refund:", err);
      alert("Failed to issue refund.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req) => {
    if (!rejectNote.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setProcessing(req.id);
    try {
      await updateDoc(doc(db, "returnRequests", req.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        adminNote: rejectNote.trim(),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: "rejected", adminNote: rejectNote.trim() }
            : r,
        ),
      );
      sendEmail(req, "rejection", rejectNote.trim());
      setRejectingId(null);
      setRejectNote("");
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject return request.");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = useMemo(() => {
    let result = requests.filter((r) => !!r.archived === showArchived);
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.orderId?.toLowerCase().includes(q) ||
          r.customer?.fullName?.toLowerCase().includes(q) ||
          r.customer?.email?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [requests, search, filterStatus, showArchived]);
  const archivedCount = requests.filter((r) => !!r.archived).length;

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => {
      c[r.status] = (c[r.status] || 0) + 1;
    });
    return c;
  }, [requests]);

  const handleArchive = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await updateDoc(doc(db, "returnRequests", id), { archived: true });
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
      await updateDoc(doc(db, "returnRequests", id), { archived: false });
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

  if (loading) {
    return (
      <div>
        <div className="h-7 bg-gray-200 rounded w-40 animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded shadow p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Return Requests</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} {showArchived ? "archived" : "active"} request
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowArchived((v) => !v);
              setSearch("");
            }}
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

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition font-medium ${
              filterStatus === s
                ? "bg-red-700 text-white border-red-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}{" "}
            <span className="ml-1 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by order ID, customer name, email, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded shadow p-10 text-center text-gray-500">
          {search || filterStatus !== "all"
            ? "No return requests match your filters."
            : "No return requests yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow">
              {/* Header row */}
              <div
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        STATUS_STYLES[req.status] || STATUS_STYLES.pending
                      }`}
                    >
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                    <span className="text-sm font-mono text-gray-500 truncate">
                      Order: {req.orderId}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>{req.customer?.fullName || "—"}</strong>{" "}
                    <span className="text-gray-400">
                      ({req.customer?.email})
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Reason: {req.reason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-500">
                    {formatDate(req.createdAt)}
                  </p>
                  <p className="text-sm font-semibold text-red-700">
                    Refund: ${formatMoney(req.refundAmount)}
                  </p>
                  {/* Small archive/unarchive button directly below refund price */}
                  <div className="mt-1">
                    {!showArchived && (
                      <button
                        type="button"
                        disabled={busy[req.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(req.id);
                        }}
                        className={`px-2 py-1 rounded font-semibold text-xs border ${
                          !busy[req.id]
                            ? "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-300"
                            : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                        }`}
                        style={{ minWidth: 0 }}
                      >
                        {busy[req.id] ? "..." : "Archive"}
                      </button>
                    )}
                    {showArchived && (
                      <button
                        type="button"
                        disabled={busy[req.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnarchive(req.id);
                        }}
                        className={`px-2 py-1 rounded font-semibold text-xs border ${
                          !busy[req.id]
                            ? "bg-blue-50 text-blue-500 hover:bg-blue-100 border-blue-200"
                            : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                        }`}
                        style={{ minWidth: 0 }}
                      >
                        {busy[req.id] ? "..." : "Unarchive"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Archive/Unarchive button under price */}

              {/* Expanded details */}
              {expanded === req.id && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Left: Details */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Customer Details
                        </p>
                        <p className="text-sm text-gray-600">
                          {req.details || "No additional details provided."}
                        </p>
                      </div>

                      {/* Photos */}
                      {req.photos && req.photos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Photos
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {req.photos.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={url}
                                  alt={`Return photo ${idx + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border hover:opacity-80 transition"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financials */}
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Refund Breakdown
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Order total</span>
                            <span>${formatMoney(req.orderTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Restocking fee (15%)
                            </span>
                            <span className="text-red-600">
                              −${formatMoney(req.restockingFee)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Refund amount</span>
                            <span className="text-green-700">
                              ${formatMoney(req.refundAmount)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Payment method:{" "}
                            {req.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Card (Stripe)"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Items + Actions */}
                    <div className="space-y-4">
                      {/* Items */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Order Items
                        </p>
                        <div className="space-y-2">
                          {(req.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 items-center bg-white rounded-lg p-2 border"
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div className="flex-1 text-sm">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-gray-400 text-xs">
                                  {item.category}
                                </p>
                              </div>
                              <p className="text-sm font-medium whitespace-nowrap">
                                {item.quantity} × ${formatMoney(item.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin note (if reviewed) */}
                      {req.adminNote && req.status !== "pending" && (
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Admin Note
                          </p>
                          <p className="text-sm text-gray-600">
                            {req.adminNote}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Reviewed: {formatDate(req.reviewedAt)}
                          </p>
                        </div>
                      )}

                      {/* Actions (pending and awaiting_return) */}
                      {req.status === "pending" && !showArchived && (
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={processing === req.id}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              {processing === req.id
                                ? "Processing..."
                                : "Send Return Instructions"}
                            </button>
                            <button
                              onClick={() =>
                                setRejectingId(
                                  rejectingId === req.id ? null : req.id,
                                )
                              }
                              disabled={processing === req.id}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>

                          {rejectingId === req.id && (
                            <div className="space-y-2">
                              <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Reason for rejection (required)..."
                                rows={2}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                              />
                              <button
                                onClick={() => handleReject(req)}
                                disabled={
                                  processing === req.id || !rejectNote.trim()
                                }
                                className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition disabled:opacity-50"
                              >
                                {processing === req.id
                                  ? "Processing..."
                                  : "Confirm Rejection"}
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={busy[req.id]}
                            onClick={() => handleArchive(req.id)}
                            className={`w-full mt-2 px-3 py-2 rounded font-semibold text-xs ${
                              !busy[req.id]
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {busy[req.id] ? "Archiving..." : "Archive"}
                          </button>
                        </div>
                      )}
                      {showArchived && (
                        <div className="space-y-3 pt-2">
                          <button
                            type="button"
                            disabled={busy[req.id]}
                            onClick={() => handleUnarchive(req.id)}
                            className={`w-full px-3 py-2 rounded font-semibold text-xs ${
                              !busy[req.id]
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {busy[req.id] ? "Unarchiving..." : "Unarchive"}
                          </button>
                        </div>
                      )}
                      {req.status === "awaiting_return" && (
                        <div className="space-y-3 pt-2">
                          <button
                            onClick={() => handleConfirmReceived(req)}
                            disabled={processing === req.id}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {processing === req.id
                              ? "Processing..."
                              : "Confirm Product Received & Issue Refund"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
