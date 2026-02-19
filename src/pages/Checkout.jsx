import { useState } from "react";
import { Navigate, useNavigate, NavLink } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAuthModal } from "../context/AuthModalContext";
import { functions } from "../firebase";
import { FaShoppingCart } from "react-icons/fa";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems } = useCart();
  const { openAuth } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    openAuth({ mode: "login", redirect: "/checkout" });
    return <Navigate to="/" replace />;
  }

  // 🛒 Empty cart → products
  if (!cartItems || cartItems.length === 0) {
    return <Navigate to="/products" replace />;
  }

  // Totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    country: "Thailand",
    postalCode: "",
  });

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );
      const result = await createCheckoutSession({
        cartItems,
        customerInfo: form,
      });
      window.location.href = result.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-5">
      <div className="mb-8 flex items-center">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <NavLink
          to="/cart"
          className="text-sm text-gray-500 hover:text-red-700 inline-flex items-center gap-2 ml-auto"
        >
          {" "}
          ← Return to Cart{" "}
        </NavLink>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* LEFT: Customer + Shipping */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Contact</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="First name"
                value={form.firstName}
                onChange={onChange("firstName")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="Last name"
                value={form.lastName}
                onChange={onChange("lastName")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={onChange("email")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Phone"
                value={form.phone}
                onChange={onChange("phone")}
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping address</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Address"
                value={form.address}
                onChange={onChange("address")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="City"
                value={form.city}
                onChange={onChange("city")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="Postal code"
                value={form.postalCode}
                onChange={onChange("postalCode")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Country"
                value={form.country}
                onChange={onChange("country")}
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Payment</h2>
            <p className="text-sm text-gray-500">
              You will be redirected to Stripe's secure checkout to enter your
              card details.
            </p>
          </div>
        </div>

        {/* RIGHT: Order summary */}
        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order summary</h2>

          <div className="space-y-4 max-h-[360px] overflow-auto pr-2">
            {cartItems.map((item) => (
              <div
                key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedMaterial}`}
                className="flex gap-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.category} • {item.selectedColor} • {item.selectedSize}{" "}
                    • {item.selectedMaterial}
                  </p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium">
                  $
                  {(
                    Number(item.price || 0) * Number(item.quantity || 0)
                  ).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold mt-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting to payment..." : "Proceed to payment"}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            Secure payment powered by Stripe.
          </p>
        </div>
      </form>
    </div>
  );
}
