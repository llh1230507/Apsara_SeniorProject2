import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
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
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          limit(100),
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
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

  if (loading) {
    return <p className="p-6 text-gray-500">Loading orders...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded shadow p-10 text-center text-gray-500">
          No orders found.
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
              {orders.map((order) => (
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
                          Pay on Arrival
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
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
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
                      {(order.status === "completed" || order.status === "cancelled") && (
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
                              {[order.customer?.houseNumber, order.customer?.street].filter(Boolean).join(" ")}
                              {order.customer?.houseNumber || order.customer?.street ? <br /> : null}
                              {order.customer?.city}{order.customer?.province ? `, ${order.customer.province}` : ""}
                              <br />
                              {order.customer?.country}
                              {order.customer?.postalCode ? ` ${order.customer.postalCode}` : ""}
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
                                      {item.selectedColor} · {item.selectedSize}{" "}
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
    </div>
  );
}
