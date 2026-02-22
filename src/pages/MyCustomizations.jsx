// src/pages/MyCustomizations.jsx
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

const CATEGORY_LABELS = {
  wood: "Wood Sculptures",
  stone: "Stone Art",
  furniture: "Furniture",
};

const STATUS_STYLES = {
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  accepted: "bg-green-50 border-green-200 text-green-700",
  rejected: "bg-red-50 border-red-200 text-red-700",
};

function formatDate(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function MyCustomizations() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
                      {String(req.status || "pending").toUpperCase()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">
                    Submitted: {formatDate(req.createdAt)}
                  </p>

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
                  </div>

                  {req.details && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {req.details}
                    </p>
                  )}

                  {req.status === "accepted" && (
                    <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                      Your request has been accepted. We will contact you soon
                      at <strong>{req.email}</strong>.
                    </p>
                  )}
                  {req.status === "rejected" && (
                    <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                      Unfortunately, we were unable to fulfill this request.
                      Feel free to submit a new one.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
