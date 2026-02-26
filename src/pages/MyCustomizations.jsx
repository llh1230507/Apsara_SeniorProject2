// src/pages/MyCustomizations.jsx
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ContactSupportModal from "../components/ContactSupportModal";

const CATEGORY_LABELS = {
  wood: "Wood Sculptures",
  stone: "Stone Art",
  furniture: "Furniture",
};

const STATUS_LABELS = {
  pending:     "Under Review",
  accepted:    "Accepted",
  in_progress: "In Progress",
  shipping:    "Shipping",
  completed:   "Completed",
  rejected:    "Rejected",
};

const STATUS_STYLES = {
  pending:     "bg-yellow-50 border-yellow-200 text-yellow-700",
  accepted:    "bg-blue-50 border-blue-200 text-blue-700",
  in_progress: "bg-purple-50 border-purple-200 text-purple-700",
  shipping:    "bg-indigo-50 border-indigo-200 text-indigo-700",
  completed:   "bg-green-50 border-green-200 text-green-700",
  rejected:    "bg-red-50 border-red-200 text-red-700",
};

// Steps in the progress tracker (happy path)
const STEPS = [
  { key: "submitted",   label: "Submitted" },
  { key: "review",      label: "Under Review" },
  { key: "accepted",    label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "shipping",    label: "Shipping" },
  { key: "completed",   label: "Completed" },
];

const STEP_ORDER = ["submitted", "review", "accepted", "in_progress", "shipping", "completed"];

const STATUS_TO_STEP = {
  pending:     "review",
  accepted:    "accepted",
  in_progress: "in_progress",
  shipping:    "shipping",
  completed:   "completed",
};

function getStepState(stepKey, status) {
  const s = status || "pending";

  // Rejected terminates at the review step
  if (s === "rejected") {
    if (stepKey === "submitted") return "done";
    if (stepKey === "review") return "rejected";
    return "pending";
  }

  // All steps done when completed
  if (s === "completed") return "done";

  const currentStep = STATUS_TO_STEP[s] || "review";
  const currentIdx  = STEP_ORDER.indexOf(currentStep);
  const stepIdx     = STEP_ORDER.indexOf(stepKey);

  if (stepIdx < currentIdx)  return "done";
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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState({ open: false, requestId: null, email: null });

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

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return <p className="p-8 pt-24">Loading your requests...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24">
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
          {requests.map((req) => (
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
                      const state = getStepState(step.key, req.status);
                      const isLast = idx === STEPS.length - 1;

                      const dotClass =
                        state === "done"
                          ? "bg-green-500 border-green-500"
                          : state === "rejected"
                            ? "bg-red-500 border-red-500"
                            : state === "active"
                              ? "bg-yellow-400 border-yellow-400"
                              : "bg-white border-gray-300";

                      const labelClass =
                        state === "done"
                          ? "text-green-600 font-medium"
                          : state === "rejected"
                            ? "text-red-600 font-medium"
                            : state === "active"
                              ? "text-yellow-600 font-medium"
                              : "text-gray-400";

                      const lineClass =
                        state === "done"
                          ? "bg-green-400"
                          : "bg-gray-200";

                      const label = step.label;

                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${dotClass}`}
                            />
                            <span className={`text-xs mt-1 whitespace-nowrap ${labelClass}`}>
                              {label}
                            </span>
                          </div>
                          {!isLast && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 ${lineClass}`} />
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
                    {req.size?.height || req.size?.width || req.size?.length ? (
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
                      ["accepted", "in_progress", "shipping", "completed"].includes(req.status) && (
                        <p>
                          <span className="font-medium">Estimated Delivery:</span>{" "}
                          {new Date(req.estimatedDelivery).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                  </div>

                  {req.details && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {req.details}
                    </p>
                  )}

                  {req.status === "accepted" && (
                    <p className="mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      Your request has been accepted. We will contact you soon
                      at <strong>{req.email}</strong>.
                    </p>
                  )}
                  {req.status === "in_progress" && (
                    <p className="mt-3 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded px-3 py-2">
                      We are currently crafting your custom order. We will notify you once it is ready to ship.
                    </p>
                  )}
                  {req.status === "shipping" && (
                    <p className="mt-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
                      Your custom order is on its way! It has been packed and shipped to you.
                    </p>
                  )}
                  {req.status === "completed" && (
                    <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                      Your custom order has been delivered and completed. Thank you for choosing us!
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
          ))}
        </div>
      )}

      <ContactSupportModal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false, requestId: null, email: null })}
        type="customization"
        referenceId={contactModal.requestId}
        customerEmail={contactModal.email}
        customerName={user?.displayName || ""}
      />
    </div>
  );
}
