import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate, NavLink } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import {
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
  doc,
  increment,
  getDoc,
} from "firebase/firestore";
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

const COUNTRY_REGION = {
  // Asia
  Thailand: "asia",
  Cambodia: "asia",
  Laos: "asia",
  Myanmar: "asia",
  Vietnam: "asia",
  Malaysia: "asia",
  Singapore: "asia",
  Indonesia: "asia",
  Philippines: "asia",
  Brunei: "asia",
  China: "asia",
  Japan: "asia",
  "South Korea": "asia",
  India: "asia",
  Bangladesh: "asia",
  Nepal: "asia",
  "Sri Lanka": "asia",
  Pakistan: "asia",
  // Oceania
  Australia: "oceania",
  "New Zealand": "oceania",
  // Europe
  "United Kingdom": "europe",
  Germany: "europe",
  France: "europe",
  Italy: "europe",
  Spain: "europe",
  Netherlands: "europe",
  Belgium: "europe",
  Sweden: "europe",
  Norway: "europe",
  Denmark: "europe",
  Finland: "europe",
  Switzerland: "europe",
  Austria: "europe",
  Portugal: "europe",
  Poland: "europe",
  "Czech Republic": "europe",
  Russia: "europe",
  Ukraine: "europe",
  // Americas
  "United States": "americas",
  Canada: "americas",
  Brazil: "americas",
  Argentina: "americas",
  Mexico: "americas",
  Colombia: "americas",
  Chile: "americas",
  Peru: "americas",
  // Middle East
  Turkey: "middleEast",
  "Saudi Arabia": "middleEast",
  "United Arab Emirates": "middleEast",
  Qatar: "middleEast",
  Kuwait: "middleEast",
  Israel: "middleEast",
  // Africa
  Egypt: "africa",
  "South Africa": "africa",
  Nigeria: "africa",
  Kenya: "africa",
};

// Shipping cost in USD by region and speed (base rate for standard items)
const SHIPPING_RATES = {
  asia: { standard: 8, express: 20 },
  oceania: { standard: 18, express: 45 },
  middleEast: { standard: 15, express: 38 },
  africa: { standard: 20, express: 50 },
  europe: { standard: 22, express: 55 },
  americas: { standard: 25, express: 60 },
};

// Extra per-item surcharge for bulky/heavy categories
const BULKY_CATEGORIES = ["furniture"];
const BULKY_SURCHARGE = {
  asia: { standard: 15, express: 30 },
  oceania: { standard: 35, express: 70 },
  middleEast: { standard: 30, express: 60 },
  africa: { standard: 40, express: 80 },
  europe: { standard: 45, express: 90 },
  americas: { standard: 50, express: 100 },
};

const CARRIERS = ["DHL", "UPS", "FedEx"];

const SPEEDS = [
  { key: "standard", label: "Standard", desc: "7–14 business days" },
  { key: "express", label: "Express", desc: "2–5 business days" },
];

// Country → { code, symbol }
const COUNTRY_CURRENCY = {
  Thailand: { code: "THB", symbol: "฿" },
  Cambodia: { code: "USD", symbol: "$" },
  Laos: { code: "LAK", symbol: "₭" },
  Myanmar: { code: "MMK", symbol: "K" },
  Vietnam: { code: "VND", symbol: "₫" },
  Malaysia: { code: "MYR", symbol: "RM" },
  Singapore: { code: "SGD", symbol: "S$" },
  Indonesia: { code: "IDR", symbol: "Rp" },
  Philippines: { code: "PHP", symbol: "₱" },
  Brunei: { code: "BND", symbol: "B$" },
  China: { code: "CNY", symbol: "¥" },
  Japan: { code: "JPY", symbol: "¥" },
  "South Korea": { code: "KRW", symbol: "₩" },
  India: { code: "INR", symbol: "₹" },
  Bangladesh: { code: "BDT", symbol: "৳" },
  Nepal: { code: "NPR", symbol: "Rs" },
  "Sri Lanka": { code: "LKR", symbol: "Rs" },
  Pakistan: { code: "PKR", symbol: "Rs" },
  Australia: { code: "AUD", symbol: "A$" },
  "New Zealand": { code: "NZD", symbol: "NZ$" },
  "United States": { code: "USD", symbol: "$" },
  Canada: { code: "CAD", symbol: "C$" },
  "United Kingdom": { code: "GBP", symbol: "£" },
  Germany: { code: "EUR", symbol: "€" },
  France: { code: "EUR", symbol: "€" },
  Italy: { code: "EUR", symbol: "€" },
  Spain: { code: "EUR", symbol: "€" },
  Netherlands: { code: "EUR", symbol: "€" },
  Belgium: { code: "EUR", symbol: "€" },
  Sweden: { code: "SEK", symbol: "kr" },
  Norway: { code: "NOK", symbol: "kr" },
  Denmark: { code: "DKK", symbol: "kr" },
  Finland: { code: "EUR", symbol: "€" },
  Switzerland: { code: "CHF", symbol: "Fr" },
  Austria: { code: "EUR", symbol: "€" },
  Portugal: { code: "EUR", symbol: "€" },
  Poland: { code: "PLN", symbol: "zł" },
  "Czech Republic": { code: "CZK", symbol: "Kč" },
  Russia: { code: "RUB", symbol: "₽" },
  Ukraine: { code: "UAH", symbol: "₴" },
  Turkey: { code: "TRY", symbol: "₺" },
  "Saudi Arabia": { code: "SAR", symbol: "SR" },
  "United Arab Emirates": { code: "AED", symbol: "د.إ" },
  Qatar: { code: "QAR", symbol: "QR" },
  Kuwait: { code: "KWD", symbol: "KD" },
  Israel: { code: "ILS", symbol: "₪" },
  Egypt: { code: "EGP", symbol: "£" },
  "South Africa": { code: "ZAR", symbol: "R" },
  Nigeria: { code: "NGN", symbol: "₦" },
  Kenya: { code: "KES", symbol: "KSh" },
  Brazil: { code: "BRL", symbol: "R$" },
  Argentina: { code: "ARS", symbol: "$" },
  Mexico: { code: "MXN", symbol: "$" },
  Colombia: { code: "COP", symbol: "$" },
  Chile: { code: "CLP", symbol: "$" },
  Peru: { code: "PEN", symbol: "S/" },
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { openAuth } = useAuthModal();
  const orderPlacedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [carrier, setCarrier] = useState("DHL");
  const [speed, setSpeed] = useState("standard");
  const [exchangeRates, setExchangeRates] = useState({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    houseNumber: "",
    street: "",
    city: "",
    province: "",
    country: "Thailand",
    postalCode: "",
  });

  // Pre-fill form from saved profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm((prev) => ({
          ...prev,
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          email: d.email || user.email || "",
          phone: d.phone || "",
          houseNumber: d.houseNumber || "",
          street: d.street || "",
          city: d.city || "",
          province: d.province || "",
          country: d.country || "Thailand",
          postalCode: d.postalCode || "",
        }));
      } else {
        setForm((prev) => ({ ...prev, email: user.email || "" }));
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch live exchange rates (base USD)
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setExchangeRates(data.rates);
      })
      .catch(() => {});
  }, []);

  if (!user) {
    openAuth({ mode: "login", redirect: "/checkout" });
    return <Navigate to="/" replace />;
  }

  if (!cartItems || cartItems.length === 0) {
    if (!orderPlacedRef.current) return <Navigate to="/products" replace />;
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const region = COUNTRY_REGION[form.country] || "asia";
  const baseShipping = SHIPPING_RATES[region][speed];

  // Count bulky items (furniture etc.) for surcharge
  const bulkyCount = cartItems.reduce((count, item) => {
    if (BULKY_CATEGORIES.includes((item.category || "").toLowerCase())) {
      return count + Number(item.quantity || 1);
    }
    return count;
  }, 0);
  const bulkySurcharge =
    bulkyCount > 0 ? bulkyCount * (BULKY_SURCHARGE[region]?.[speed] || 0) : 0;
  const shipping = baseShipping + bulkySurcharge;
  const total = subtotal + shipping;
  const isCambodia = form.country === "Cambodia";

  // Auto-switch to Stripe when country is not Cambodia
  useEffect(() => {
    if (!isCambodia && paymentMethod === "cod") {
      setPaymentMethod("stripe");
    }
  }, [isCambodia, paymentMethod]);

  // Currency display helpers
  const currencyInfo = COUNTRY_CURRENCY[form.country] || {
    code: "USD",
    symbol: "$",
  };
  const fxRate = exchangeRates[currencyInfo.code] || 1;
  const fmt = (usd) => {
    const converted = usd * fxRate;
    const decimals = ["JPY", "KRW", "VND", "IDR", "CLP", "MMK", "LAK"].includes(
      currencyInfo.code,
    )
      ? 0
      : 2;
    return `${currencyInfo.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };
  const isUSD = currencyInfo.code === "USD";

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!/^\+?[\d\s\-()\[\]]{7,20}$/.test(form.phone.trim())) {
      setError(
        "Please enter a valid phone number (digits only, 7–20 characters).",
      );
      setLoading(false);
      return;
    }

    try {
      if (paymentMethod === "cod") {
        // Save order directly to Firestore
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: "pending",
          subtotal,
          shipping,
          total,
          shippingCarrier: carrier,
          shippingSpeed: speed,
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

            selectedMaterial: item.selectedMaterial || "",
            variantKey: item.variantKey || "",
          })),
        });

        // Decrement stock for each item
        const batch = writeBatch(db);
        for (const item of cartItems) {
          if (item.id) {
            batch.update(doc(db, "products", item.id), {
              stock: increment(-Number(item.quantity || 0)),
            });
          }
        }
        await batch.commit();

        orderPlacedRef.current = true;
        navigate("/order-success");
        clearCart();
      } else {
        // Stripe flow
        const createCheckoutSession = httpsCallable(
          functions,
          "createCheckoutSession",
        );
        const result = await createCheckoutSession({
          cartItems,
          customerInfo: form,
          shipping,
          shippingCarrier: carrier,
          shippingSpeed: speed,
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
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/[^\d\s+\-()\[\]]/g, ""),
                  }))
                }
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
              <input
                className="border rounded-lg px-4 py-3 sm:col-span-2"
                placeholder="Postal Code"
                value={form.postalCode}
                onChange={onChange("postalCode")}
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
            </div>
          </div>

          {/* Shipping Options */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping</h2>

            {/* Carrier */}
            <p className="text-sm font-medium text-gray-700 mb-2">Carrier</p>
            <div className="flex gap-3 flex-wrap mb-5">
              {CARRIERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCarrier(c)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                    carrier === c
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Speed */}
            <p className="text-sm font-medium text-gray-700 mb-2">
              Delivery Speed
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SPEEDS.map((s) => {
                const base = SHIPPING_RATES[region][s.key];
                const surcharge =
                  bulkyCount > 0
                    ? bulkyCount * (BULKY_SURCHARGE[region]?.[s.key] || 0)
                    : 0;
                const rate = base + surcharge;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSpeed(s.key)}
                    className={`flex items-start gap-3 border-2 rounded-xl px-4 py-3 text-left transition ${
                      speed === s.key
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                    <span className="font-semibold text-sm">{fmt(rate)}</span>
                  </button>
                );
              })}
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

              {/* Cash on Delivery */}
              <button
                type="button"
                onClick={() => isCambodia && setPaymentMethod("cod")}
                disabled={!isCambodia}
                className={`flex items-center gap-3 border-2 rounded-xl px-4 py-4 text-left transition ${
                  !isCambodia
                    ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                    : paymentMethod === "cod"
                      ? "border-red-600 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FaMoneyBillWave
                  className={`text-xl ${
                    paymentMethod === "cod" && isCambodia
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">
                    {isCambodia
                      ? "Pay with cash upon delivery"
                      : "Available for Cambodia only"}
                  </p>
                </div>
                {paymentMethod === "cod" && isCambodia && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-600" />
                )}
              </button>
            </div>

            {!isCambodia && (
              <p className="mt-3 text-sm text-amber-600">
                Cash on Delivery is only available for orders within Cambodia.
                International orders require card payment.
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
                key={`${item.id}-${item.selectedColor}-${item.selectedMaterial}`}
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
                    {item.selectedMaterial}
                  </p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium">
                  {fmt(Number(item.price || 0) * Number(item.quantity || 0))}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Shipping
                <span className="ml-1 text-xs text-gray-400">
                  ({carrier} · {speed === "standard" ? "Standard" : "Express"})
                </span>
              </span>
              <span className="font-medium">{fmt(shipping)}</span>
            </div>
            {bulkySurcharge > 0 && (
              <p className="text-xs text-gray-400 ml-1">
                Includes {fmt(bulkySurcharge)} surcharge for {bulkyCount}{" "}
                furniture item{bulkyCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex justify-between text-lg font-bold mt-4">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>

          {!isUSD && (
            <p className="text-xs text-gray-400 mt-1 text-right">
              Displayed in {currencyInfo.code} · Charged in USD
            </p>
          )}

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

          <p className="text-xs text-gray-400 mt-2 text-center">
            By placing this order you agree to our{" "}
            <a
              href="/return-policy"
              target="_blank"
              className="text-red-700 hover:underline"
            >
              Return &amp; Refund Policy
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
