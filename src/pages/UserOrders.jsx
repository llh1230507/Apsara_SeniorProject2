// src/pages/Orders.jsx
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

function formatMoney(n) {
  const num = Number(n || 0);
  return num.toFixed(2);
}

function formatDate(ts) {
  if (!ts) return "";
  // Firestore Timestamp -> JS Date
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function UserOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 must be logged in
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user.uid]);

  const totalOrders = orders.length;

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
  }, [orders]);

  if (loading) {
    return <p className="p-8 pt-24">Loading your orders...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-24">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-gray-600 mt-1">
            {totalOrders} order{totalOrders !== 1 ? "s" : ""} • Total spent: $
            {formatMoney(totalSpent)}
          </p>
        </div>

        <NavLink
          to="/products"
          className="border px-4 py-2 rounded hover:bg-gray-50"
        >
          Continue shopping
        </NavLink>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">
            Once you place an order, it will show here.
          </p>
          <NavLink
            to="/products"
            className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800"
          >
            Browse Products
          </NavLink>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-mono">{order.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Placed: {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm px-3 py-1 rounded-full border ${
                      order.status === "pending"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                        : order.status === "paid"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    {String(order.status || "pending").toUpperCase()}
                  </span>

                  <p className="text-lg font-semibold text-red-700">
                    ${formatMoney(order.subtotal)}
                  </p>
                </div>
              </div>

              {/* Customer */}
              {order.customer && (
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="text-sm">
                    <p className="font-medium">Shipping To</p>
                    <p className="text-gray-600">
                      {order.customer.fullName}
                      <br />
                      {order.customer.address}
                      <br />
                      {order.customer.city}, {order.customer.country}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Contact</p>
                    <p className="text-gray-600">
                      {order.customer.email}
                      <br />
                      {order.customer.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-4">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={`${item.productId || item.id}-${idx}`}
                    className="flex gap-4 items-start"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />

                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.category} • {item.selectedColor} •{" "}
                        {item.selectedSize} • {item.selectedMaterial}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {item.quantity} × ${formatMoney(item.price)}
                      </p>
                    </div>

                    <p className="font-medium">
                      ${formatMoney(Number(item.price) * Number(item.quantity))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-gray-500">
                  Need help? Contact us from the Contact page.
                </p>
                <NavLink
                  to="/contact"
                  className="text-sm text-red-700 hover:underline"
                >
                  Contact
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
