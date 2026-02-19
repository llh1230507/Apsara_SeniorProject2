import { useEffect } from "react";
import { useSearchParams, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function OrderSuccess() {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-12 text-center max-w-lg mx-auto">
      <div className="text-6xl mb-6">✓</div>
      <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
      <p className="text-gray-600 mb-2">
        Thank you! Your payment was successful.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        We'll contact you shortly with shipping details.
      </p>
      <NavLink
        to="/products"
        className="bg-red-700 text-white px-6 py-3 rounded-lg inline-block"
      >
        Continue Shopping
      </NavLink>
    </div>
  );
}
