// src/pages/MyCustomizations.jsx
import { Navigate, NavLink, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  orderBy,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import useCategories from "../hooks/useCategories";
import ContactSupportModal from "../components/ContactSupportModal";

const EMPTY_ADDRESS = {
  firstName: "",
  lastName: "",
  street: "",
  houseNumber: "",
  city: "",
  province: "",
  country: "Thailand",
  postalCode: "",
  phone: "",
};

const STATUS_LABELS = {
  pending: "Under Review",
  quoted: "Price Quoted",
  accepted: "Accepted",
  in_progress: "In Progress",
  shipping: "Shipping",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_STYLES = {
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  quoted: "bg-orange-50 border-orange-200 text-orange-700",
  accepted: "bg-blue-50 border-blue-200 text-blue-700",
  in_progress: "bg-purple-50 border-purple-200 text-purple-700",
  shipping: "bg-indigo-50 border-indigo-200 text-indigo-700",
  completed: "bg-green-50 border-green-200 text-green-700",
  rejected: "bg-red-50 border-red-200 text-red-700",
  cancelled: "bg-gray-50 border-gray-200 text-gray-500",
};

// Steps in the progress tracker (happy path)
const STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Under Review" },
  { key: "quoted", label: "Quoted" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "shipping", label: "Shipping" },
  { key: "completed", label: "Completed" },
];

const STEP_ORDER = [
  "submitted",
  "review",
  "quoted",
  "accepted",
  "in_progress",
  "shipping",
  "completed",
];

const STATUS_TO_STEP = {
  pending: "review",
  quoted: "quoted",
  accepted: "accepted",
  in_progress: "in_progress",
  shipping: "shipping",
  completed: "completed",
};

function getStepState(stepKey, status, request = {}) {
  const s = status || "pending";

  // Rejected terminates at the review step
  if (s === "rejected") {
    if (stepKey === "submitted") return "done";
    if (stepKey === "review") return "rejected";
    return "pending";
  }

  // Cancelled terminates at the appropriate step
  if (s === "cancelled") {
    let cancelledStep = "review";
    if (request.acceptedAt) cancelledStep = "accepted";
    else if (request.quotedPrice != null) cancelledStep = "quoted";

    const cancelledIdx = STEP_ORDER.indexOf(cancelledStep);
    const stepIdx = STEP_ORDER.indexOf(stepKey);

    if (stepIdx < cancelledIdx) return "done";
    if (stepIdx === cancelledIdx) return "cancelled";
    return "pending";
  }

  // All steps done when completed
  if (s === "completed") return "done";

  const currentStep = STATUS_TO_STEP[s] || "review";
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  const stepIdx = STEP_ORDER.indexOf(stepKey);

  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function MyCustomizations() {
  const { user } = useAuth();

  const { categories: catList } = useCategories();
  const CATEGORY_LABELS = useMemo(
    () => Object.fromEntries(catList.map((c) => [c.key, c.label])),
    [catList],
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState({});
  const [now, setNow] = useState(Date.now());
  const [contactModal, setContactModal] = useState({
    open: false,
    requestId: null,
    email: null,
  });
  // Address modal for accepting a quote
  const [addressModal, setAddressModal] = useState({
    open: false,
    request: null,
  });
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS });
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentMsg, setPaymentMsg] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "customizationRequests"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        setRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to load customization requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.uid]);

  // Handle payment return from Stripe
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setPaymentMsg(
        "Payment successful! Your customization order has been confirmed.",
      );
      // Clear URL params
      setSearchParams({}, { replace: true });
      // Re-fetch requests to get updated status
      if (user) {
        const refetch = async () => {
          const q = query(
            collection(db, "customizationRequests"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
          );
          const snap = await getDocs(q);
          setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        };
        refetch();
      }
    } else if (payment === "cancelled") {
      setPaymentMsg(
        "Payment was cancelled. You can try again from your quoted request.",
      );
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Timer for 24h countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fill address form from user profile when opening modal
  const openAddressModal = async (reqDoc) => {
    let prefill = { ...EMPTY_ADDRESS };
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        prefill = {
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          street: d.street || "",
          houseNumber: d.houseNumber || "",
          city: d.city || "",
          province: d.province || "",
          country: d.country || "Thailand",
          postalCode: d.postalCode || "",
          phone: d.phone || reqDoc.phone || "",
        };
      }
    } catch (_) {
      /* ignore */
    }
    setAddressForm(prefill);
    setAddressModal({ open: true, request: reqDoc });
  };

  const handleAcceptQuote = async () => {
    const reqDoc = addressModal.request;
    if (!reqDoc) return;
    const id = reqDoc.id;

    // Validate address
    const { firstName, lastName, street, city, province, postalCode, phone } =
      addressForm;
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !street.trim() ||
      !city.trim() ||
      !province.trim() ||
      !postalCode.trim() ||
      !phone.trim()
    ) {
      alert("Please fill in all address fields.");
      return;
    }

    setActionBusy((b) => ({ ...b, [id]: true }));
    try {
      // Call Cloud Function to create Stripe checkout
      const createCustomizationCheckout = httpsCallable(
        functions,
        "createCustomizationCheckout",
      );
      const result = await createCustomizationCheckout({
        requestId: id,
        shippingAddress: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          street: street.trim(),
          houseNumber: addressForm.houseNumber.trim(),
          city: city.trim(),
          province: province.trim(),
          country: addressForm.country,
          postalCode: postalCode.trim(),
          phone: phone.trim(),
        },
      });
      // Redirect to Stripe
      window.location.href = result.data.url;
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to start payment. Please try again.");
    } finally {
      setActionBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeclineQuote = async (reqDoc) => {
    if (!window.confirm("Are you sure you want to decline this quote?")) return;
    const id = reqDoc.id;
    setActionBusy((b) => ({ ...b, [id]: true }));
    try {
      await updateDoc(doc(db, "customizationRequests", id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to decline quote");
    } finally {
      setActionBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const handleCancelOrder = async (reqDoc) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel? You will receive a full refund.",
      )
    )
      return;
    const id = reqDoc.id;
    setActionBusy((b) => ({ ...b, [id]: true }));
    try {
      // Call the refund cloud function (admin-side, but within 24h it's auto full refund)
      // For within-24h we let the customer directly cancel + refund
      const refundFn = httpsCallable(functions, "refundCustomization");
      const result = await refundFn({ requestId: id });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "cancelled",
                refundAmount: result.data.refundAmount,
                refundPercent: result.data.refundPercent,
              }
            : r,
        ),
      );
    } catch (err) {
      console.error(err);
      // Fallback: just update status directly if refund fails
      try {
        await updateDoc(doc(db, "customizationRequests", id), {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
        });
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
        );
      } catch (e) {
        alert("Failed to cancel order");
      }
    } finally {
      setActionBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  // Post-24h: request cancellation (admin must approve)
  const handleRequestCancellation = async (reqDoc) => {
    if (
      !window.confirm(
        "This will send a cancellation request to the admin for review. Continue?",
      )
    )
      return;
    const id = reqDoc.id;
    setActionBusy((b) => ({ ...b, [id]: true }));
    try {
      await updateDoc(doc(db, "customizationRequests", id), {
        cancellationRequested: true,
        cancellationRequestedAt: serverTimestamp(),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, cancellationRequested: true } : r,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to request cancellation");
    } finally {
      setActionBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return <p className="p-8 pt-24">Loading your requests...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24">
      {/* Payment result message */}
      {paymentMsg && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            paymentMsg.includes("successful")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}
        >
          {paymentMsg}
          <button
            onClick={() => setPaymentMsg(null)}
            className="ml-3 text-xs underline opacity-70 hover:opacity-100"
          >
            dismiss
          </button>
        </div>
      )}

      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Customization Requests</h1>
          <p className="text-gray-600 mt-1">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NavLink
          to="/customize"
          className="border px-4 py-2 rounded hover:bg-gray-50 text-sm"
        >
          New Request
        </NavLink>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">No requests yet</h2>
          <p className="text-gray-600 mb-6">
            Submit a customization request and track its status here.
          </p>
          <NavLink
            to="/customize"
            className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800"
          >
            Customize a Product
          </NavLink>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((req) => {
            // 24h cancellation window computation
            const acceptedAtMs = req.acceptedAt?.toDate
              ? req.acceptedAt.toDate().getTime()
              : null;
            const cancelDeadline = acceptedAtMs
              ? acceptedAtMs + 24 * 60 * 60 * 1000
              : null;
            const cancelRemaining = cancelDeadline
              ? Math.max(0, cancelDeadline - now)
              : 0;
            const canCancel = req.status === "accepted" && cancelRemaining > 0;
            const cancelHrs = Math.floor(cancelRemaining / 3_600_000);
            const cancelMins = Math.floor(
              (cancelRemaining % 3_600_000) / 60_000,
            );
            const cancelSecs = Math.floor((cancelRemaining % 60_000) / 1000);

            return (
              <div key={req.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Image */}
                  {req.imageUrl && (
                    <img
                      src={req.imageUrl}
                      alt="Reference"
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">
                        {CATEGORY_LABELS[req.category] ||
                          req.category ||
                          "Custom Request"}
                      </p>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-medium ${
                          STATUS_STYLES[req.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {STATUS_LABELS[req.status] || "Under Review"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                      Submitted: {formatDate(req.createdAt)}
                    </p>

                    {/* Status progress tracker */}
                    <div className="flex items-center gap-0 mb-4">
                      {STEPS.map((step, idx) => {
                        const state = getStepState(step.key, req.status, req);
                        const isLast = idx === STEPS.length - 1;

                        const dotClass =
                          state === "done"
                            ? "bg-green-500 border-green-500"
                            : state === "rejected"
                              ? "bg-red-500 border-red-500"
                              : state === "cancelled"
                                ? "bg-gray-400 border-gray-400"
                                : state === "active"
                                  ? "bg-yellow-400 border-yellow-400"
                                  : "bg-white border-gray-300";

                        const labelClass =
                          state === "done"
                            ? "text-green-600 font-medium"
                            : state === "rejected"
                              ? "text-red-600 font-medium"
                              : state === "cancelled"
                                ? "text-gray-500 font-medium"
                                : state === "active"
                                  ? "text-yellow-600 font-medium"
                                  : "text-gray-400";

                        const lineClass =
                          state === "done" ? "bg-green-400" : "bg-gray-200";

                        const label = step.label;

                        return (
                          <div
                            key={step.key}
                            className="flex items-center flex-1"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${dotClass}`}
                              />
                              <span
                                className={`text-xs mt-1 whitespace-nowrap ${labelClass}`}
                              >
                                {label}
                              </span>
                            </div>
                            {!isLast && (
                              <div
                                className={`flex-1 h-0.5 mx-1 mb-4 ${lineClass}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                      {req.duration && (
                        <p>
                          <span className="font-medium">Desired Duration:</span>{" "}
                          {req.duration}
                        </p>
                      )}
                      {req.size?.height ||
                      req.size?.width ||
                      req.size?.length ? (
                        <p>
                          <span className="font-medium">Size:</span>{" "}
                          {[
                            req.size.width && `W ${req.size.width}cm`,
                            req.size.length && `L ${req.size.length}cm`,
                            req.size.height && `H ${req.size.height}cm`,
                          ]
                            .filter(Boolean)
                            .join(" × ")}
                        </p>
                      ) : null}
                      {req.estimatedDelivery &&
                        [
                          "accepted",
                          "in_progress",
                          "shipping",
                          "completed",
                        ].includes(req.status) && (
                          <p>
                            <span className="font-medium">
                              Estimated Delivery:
                            </span>{" "}
                            {new Date(req.estimatedDelivery).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        )}
                    </div>

                    {req.details && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {req.details}
                      </p>
                    )}

                    {req.status === "quoted" && (
                      <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800 font-semibold mb-2">
                          Price Quote: $
                          {Number(req.quotedPrice || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-orange-600 mb-3">
                          Please review the quoted price and accept or decline.
                        </p>
                        <div className="flex gap-3">
                          <button
                            disabled={!!actionBusy[req.id]}
                            onClick={() => openAddressModal(req)}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionBusy[req.id]
                              ? "Processing..."
                              : "Accept Quote"}
                          </button>
                          <button
                            disabled={!!actionBusy[req.id]}
                            onClick={() => handleDeclineQuote(req)}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionBusy[req.id] ? "Processing..." : "Decline"}
                          </button>
                        </div>
                      </div>
                    )}
                    {req.status === "accepted" && (
                      <div className="mt-3">
                        {req.paidAmount != null && (
                          <p className="text-sm text-green-700 mb-2">
                            ✅ Paid:{" "}
                            <strong>
                              ${Number(req.paidAmount).toLocaleString()}
                            </strong>
                          </p>
                        )}
                        {canCancel ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">
                              ✅ Your request has been accepted! You have{" "}
                              <strong>
                                {cancelHrs}h {cancelMins}m {cancelSecs}s
                              </strong>{" "}
                              remaining to cancel with a{" "}
                              <strong>full refund</strong>.
                            </p>
                            <button
                              disabled={!!actionBusy[req.id]}
                              onClick={() => handleCancelOrder(req)}
                              className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                              {actionBusy[req.id]
                                ? "Processing..."
                                : "Cancel Order (Full Refund)"}
                            </button>
                          </div>
                        ) : req.cancellationRequested ? (
                          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            ⏳ Your cancellation request has been sent and is
                            pending admin review.
                          </p>
                        ) : (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">
                              Your request has been confirmed and is being
                              processed. We will contact you soon at{" "}
                              <strong>{req.email}</strong>.
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              Note: Cancellations after 24 hours are subject to
                              a <strong>50% refund</strong> and require admin
                              approval.
                            </p>
                            <button
                              disabled={!!actionBusy[req.id]}
                              onClick={() => handleRequestCancellation(req)}
                              className="mt-1 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50"
                            >
                              {actionBusy[req.id]
                                ? "Processing..."
                                : "Request Cancellation (50% Refund)"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {req.status === "in_progress" && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-700 mb-2">
                          We are currently crafting your custom order. We will
                          notify you once it is ready to ship.
                        </p>
                        {req.cancellationRequested ? (
                          <p className="text-xs text-amber-600 font-medium">
                            ⏳ Cancellation request pending admin review
                          </p>
                        ) : (
                          <button
                            disabled={!!actionBusy[req.id]}
                            onClick={() => handleRequestCancellation(req)}
                            className="px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50"
                          >
                            {actionBusy[req.id]
                              ? "Processing..."
                              : "Request Cancellation"}
                          </button>
                        )}
                      </div>
                    )}
                    {req.status === "shipping" && (
                      <p className="mt-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
                        Your custom order is on its way! It has been packed and
                        shipped to you.
                      </p>
                    )}
                    {req.status === "completed" && (
                      <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                        Your custom order has been delivered and completed.
                        Thank you for choosing us!
                      </p>
                    )}
                    {req.status === "rejected" && (
                      <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                        Unfortunately, we were unable to fulfill this request.
                        {req.rejectionReason && (
                          <span className="block mt-1">
                            <span className="font-medium">Reason:</span>{" "}
                            {req.rejectionReason}
                          </span>
                        )}
                        <span className="block mt-1 text-red-500">
                          Feel free to submit a new one.
                        </span>
                      </p>
                    )}
                    {req.status === "cancelled" && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <p>This request was cancelled.</p>
                        {req.refundAmount > 0 && (
                          <p className="mt-1 text-green-700 font-medium">
                            Refund of $
                            {Number(req.refundAmount).toLocaleString()} (
                            {req.refundPercent}%) has been processed.
                          </p>
                        )}
                        <p className="mt-1 text-gray-500">
                          Feel free to submit a new request anytime.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end border-t pt-3">
                      <button
                        onClick={() =>
                          setContactModal({
                            open: true,
                            requestId: req.id,
                            email: req.email || req.userEmail || user?.email,
                          })
                        }
                        className="text-sm text-red-700 hover:underline"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContactSupportModal
        open={contactModal.open}
        onClose={() =>
          setContactModal({ open: false, requestId: null, email: null })
        }
        type="customization"
        referenceId={contactModal.requestId}
        customerEmail={contactModal.email}
        customerName={user?.displayName || ""}
      />

      {/* Shipping Address Modal (shown when accepting a quote) */}
      {addressModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-1">Shipping Address</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide your shipping address to confirm your order.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={addressForm.firstName}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={addressForm.lastName}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  House Number
                </label>
                <input
                  type="text"
                  value={addressForm.houseNumber}
                  onChange={(e) =>
                    setAddressForm((f) => ({
                      ...f,
                      houseNumber: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Street *
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, street: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Province *
                </label>
                <input
                  type="text"
                  value={addressForm.province}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, province: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, country: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm((f) => ({
                      ...f,
                      postalCode: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            {addressModal.request?.quotedPrice != null && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm font-semibold text-orange-800">
                  Total: $
                  {Number(addressModal.request.quotedPrice).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddressModal({ open: false, request: null })}
                className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!actionBusy[addressModal.request?.id]}
                onClick={handleAcceptQuote}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {actionBusy[addressModal.request?.id]
                  ? "Processing..."
                  : "Confirm & Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
