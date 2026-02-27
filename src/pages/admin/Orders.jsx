import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import emailjs from "@emailjs/browser";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Payment Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

const STATUS_EMAIL = {
  pending: {
    subject: "We received your order 🛍️",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nWe have received your order #${order.id}. We will confirm it shortly.\n\nThank you for shopping with us!`,
  },
  paid: {
    subject: "Payment confirmed ✅",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nYour payment for order #${order.id} has been confirmed. We are now preparing your order.\n\nThank you for your purchase!`,
  },
  processing: {
    subject: "Your order is being prepared 📦",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nGood news! Your order #${order.id} is currently being prepared and will be shipped soon.\n\nWe will notify you once it is on its way.`,
  },
  shipped: {
    subject: "Your order has been shipped 🚚",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nYour order #${order.id} has been shipped via ${order.shippingCarrier || "our carrier"}.\n\nExpected delivery: ${order.shippingSpeed === "express" ? "2–5 business days" : "7–14 business days"}.\n\nThank you for your patience!`,
  },
  completed: {
    subject: "Your order has been delivered 🎉",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nYour order #${order.id} has been delivered. We hope you love your purchase!\n\nIf you have any questions or concerns, feel free to contact us.\n\nThank you for shopping with us!`,
  },
  cancelled: {
    subject: "Your order has been cancelled ❌",
    message: (order) =>
      `Hi ${order.customer?.fullName || "there"},\n\nYour order #${order.id} has been cancelled.\n\nIf you did not request this or have any questions, please contact our support team.\n\nWe apologize for any inconvenience.`,
  },
};

function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOrders([]);
    setHasMore(true);
    lastDocRef.current = null;

    const run = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
        setHasMore(snap.docs.length === PAGE_SIZE);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === PAGE_SIZE);
      setOrders((prev) => [
        ...prev,
        ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ]);
    } catch (err) {
      console.error("Failed to load more orders:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      const updatedOrder = orders.find((o) => o.id === orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );

      // Send status notification email
      const emailInfo = STATUS_EMAIL[newStatus];
      const customerEmail = updatedOrder?.customer?.email;
      if (emailInfo && customerEmail) {
        const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        emailjs
          .send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
              to_email: customerEmail,
              subject: emailInfo.subject,
              message: emailInfo.message(updatedOrder),
            },
            PUBLIC_KEY,
          )
          .catch((err) => console.error("Email failed:", err));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const itemNames = (o.items || [])
        .map((i) => (i.name || "").toLowerCase())
        .join(" ");
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customer?.fullName || "").toLowerCase().includes(q) ||
        (o.customer?.email || "").toLowerCase().includes(q) ||
        (o.status || "pending").toLowerCase().includes(q) ||
        itemNames.includes(q)
      );
    });
  }, [orders, search]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="mb-6">
          <div className="h-9 bg-gray-200 rounded-lg w-full animate-pulse" />
        </div>
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="bg-gray-100 p-3 flex gap-4">
            {["w-28", "w-24", "w-32", "w-16", "w-20", "w-20", "w-24"].map(
              (w, i) => (
                <div
                  key={i}
                  className={`h-3 bg-gray-200 rounded ${w} animate-pulse`}
                />
              ),
            )}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-t p-3 flex gap-4 items-center">
              <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-2.5 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-10 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-full w-20 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">
          {filtered.length}
          {filtered.length !== orders.length ? ` / ${orders.length}` : ""} order
          {orders.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by order ID, customer name, email, status, item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded shadow p-10 text-center text-gray-500">
          {search ? "No orders match your search." : "No orders found."}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((order) => (
                <>
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">
                      {order.id}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-3">
                      <p className="font-medium">
                        {order.customer?.fullName || "—"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {order.customer?.email}
                      </p>
                    </td>
                    <td className="p-3 text-gray-600">
                      {(order.items || []).length} item
                      {(order.items || []).length !== 1 ? "s" : ""}
                    </td>
                    <td className="p-3 font-semibold">
                      ${formatMoney(order.subtotal)}
                    </td>
                    <td className="p-3">
                      {order.paymentMethod === "cod" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Cash on Delievery
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          Card
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status || "pending"}
                        disabled={updating === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                          STATUS_STYLES[order.status] || STATUS_STYLES.pending
                        } ${updating === order.id ? "opacity-50" : ""}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 flex gap-2 items-center">
                      <button
                        onClick={() =>
                          setExpanded(expanded === order.id ? null : order.id)
                        }
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expanded === order.id ? "Hide" : "Details"}
                      </button>
                      {(order.status === "completed" ||
                        order.status === "cancelled") && (
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>

                  {expanded === order.id && (
                    <tr
                      key={`${order.id}-expanded`}
                      className="bg-gray-50 border-t"
                    >
                      <td colSpan={8} className="p-4">
                        <div className="grid sm:grid-cols-2 gap-6">
                          {/* Shipping info */}
                          <div>
                            <p className="font-medium mb-1 text-gray-700">
                              Shipping Address
                            </p>
                            <p className="text-gray-600 text-sm">
                              {[
                                order.customer?.houseNumber,
                                order.customer?.street,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              {order.customer?.houseNumber ||
                              order.customer?.street ? (
                                <br />
                              ) : null}
                              {order.customer?.city}
                              {order.customer?.province
                                ? `, ${order.customer.province}`
                                : ""}
                              <br />
                              {order.customer?.country}
                              {order.customer?.postalCode
                                ? ` ${order.customer.postalCode}`
                                : ""}
                              <br />
                              {order.customer?.phone}
                            </p>
                          </div>

                          {/* Items */}
                          <div>
                            <p className="font-medium mb-2 text-gray-700">
                              Items
                            </p>
                            <div className="space-y-2">
                              {(order.items || []).map((item, idx) => (
                                <div
                                  key={`${item.productId || item.id}-${idx}`}
                                  className="flex gap-3 items-center"
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="flex-1 text-sm">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-gray-400 text-xs">
                                      {item.selectedColor}{" "}
                                      · {item.selectedMaterial}
                                    </p>
                                  </div>
                                  <p className="text-sm font-medium whitespace-nowrap">
                                    {item.quantity} × ${formatMoney(item.price)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !search && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
