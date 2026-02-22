import { useState } from "react";
import { Navigate, useNavigate, NavLink } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAuthModal } from "../context/AuthModalContext";
import { functions, db } from "../firebase";
import { FaArrowLeft, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";

const COUNTRIES = [
  "Thailand",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Vietnam",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Philippines",
  "Brunei",
  "China",
  "Japan",
  "South Korea",
  "India",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "Pakistan",
  "Australia",
  "New Zealand",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Russia",
  "Ukraine",
  "Turkey",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Israel",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Argentina",
  "Mexico",
  "Colombia",
  "Chile",
  "Peru",
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { openAuth } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  if (!user) {
    openAuth({ mode: "login", redirect: "/checkout" });
    return <Navigate to="/" replace />;
  }

  if (!cartItems || cartItems.length === 0) {
    return <Navigate to="/products" replace />;
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    houseNumber: "",
    street: "",
    city: "",
    province: "",
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
      if (paymentMethod === "cod") {
        // Save order directly to Firestore
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: "pending",
          subtotal,
          paymentMethod: "cod",
          customer: {
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: form.phone,
            houseNumber: form.houseNumber,
            street: form.street,
            city: form.city,
            province: form.province,
            country: form.country,
            postalCode: form.postalCode,
          },
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            imageUrl: item.imageUrl || "",
            category: item.category || "",
            selectedColor: item.selectedColor || "",
            selectedSize: item.selectedSize || "",
            selectedMaterial: item.selectedMaterial || "",
            variantKey: item.variantKey || "",
          })),
        });

        clearCart();
        navigate("/order-success");
      } else {
        // Stripe flow
        const createCheckoutSession = httpsCallable(
          functions,
          "createCheckoutSession",
        );
        const result = await createCheckoutSession({
          cartItems,
          customerInfo: form,
        });
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-5">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <NavLink
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-black-700 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-full px-4 py-2 transition"
        >
          <FaArrowLeft className="text-xs" />
          Return to Cart
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
        {/* LEFT: Customer + Shipping + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
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
                placeholder="Phone number"
                value={form.phone}
                onChange={onChange("phone")}
                required
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="House No. / Building"
                value={form.houseNumber}
                onChange={onChange("houseNumber")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="Street / Road"
                value={form.street}
                onChange={onChange("street")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="City / District"
                value={form.city}
                onChange={onChange("city")}
                required
              />
              <input
                className="border rounded-lg px-4 py-3"
                placeholder="Province / State"
                value={form.province}
                onChange={onChange("province")}
                required
              />
              <select
                className="border rounded-lg px-4 py-3 bg-white sm:col-span-2"
                value={form.country}
                onChange={onChange("country")}
                required
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Postal Code"
                value={form.postalCode}
                onChange={onChange("postalCode")}
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Stripe */}
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`flex items-center gap-3 border-2 rounded-xl px-4 py-4 text-left transition ${
                  paymentMethod === "stripe"
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FaCreditCard
                  className={`text-xl ${
                    paymentMethod === "stripe"
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm">Pay with Card</p>
                  <p className="text-xs text-gray-500">
                    Secure payment via Stripe
                  </p>
                </div>
                {paymentMethod === "stripe" && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-600" />
                )}
              </button>

              {/* Pay on Arrival */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`flex items-center gap-3 border-2 rounded-xl px-4 py-4 text-left transition ${
                  paymentMethod === "cod"
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FaMoneyBillWave
                  className={`text-xl ${
                    paymentMethod === "cod" ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm">Pay on Arrival</p>
                  <p className="text-xs text-gray-500">
                    Pay with cash upon delivery
                  </p>
                </div>
                {paymentMethod === "cod" && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-600" />
                )}
              </button>
            </div>

            {paymentMethod === "stripe" && (
              <p className="mt-3 text-sm text-gray-500">
                You will be redirected to Stripe's secure checkout to enter
                your card details.
              </p>
            )}
            {paymentMethod === "cod" && (
              <p className="mt-3 text-sm text-gray-500">
                Your order will be placed and payment collected upon delivery.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

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
                    {item.category} • {item.selectedColor} •{" "}
                    {item.selectedSize} • {item.selectedMaterial}
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
            className="w-full mt-6 bg-red-700 text-white py-3 rounded-lg hover:bg-red-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? paymentMethod === "stripe"
                ? "Redirecting..."
                : "Placing order..."
              : paymentMethod === "stripe"
                ? "Proceed to Payment"
                : "Place Order"}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            {paymentMethod === "stripe"
              ? "Secure payment powered by Stripe."
              : "Payment collected upon delivery."}
          </p>
        </div>
      </form>
    </div>
  );
}
