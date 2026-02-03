import { NavLink } from "react-router-dom";

export default function OrderSuccess() {
  return (
    <div className="p-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Order Placed 🎉</h1>
      <p className="text-gray-600 mb-6">
        Thank you! We’ll contact you shortly.
      </p>

      <NavLink
        to="/products"
        className="bg-red-700 text-white px-6 py-3 rounded-lg"
      >
        Continue Shopping
      </NavLink>
    </div>
  );
}
