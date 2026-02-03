import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { cartItems, clearCart } = useCart();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  

  const total = cartItems.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
      
      {/* LEFT — FORM */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Contact */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Contact information</h2>
          <input
            type="email"
            placeholder="Email address"
            className="w-full border px-4 py-3 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            You are checking out as a guest
          </p>
        </div>

        {/* Shipping */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Shipping address</h2>

          <select className="w-full border px-4 py-3 rounded">
            <option>Thailand</option>
            <option>Switzerland</option>
            <option>United States</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First name" className="border px-4 py-3 rounded" />
            <input placeholder="Last name" className="border px-4 py-3 rounded" />
          </div>

          <input placeholder="Address" className="border px-4 py-3 rounded w-full" />

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Postal code" className="border px-4 py-3 rounded" />
            <input placeholder="City" className="border px-4 py-3 rounded" />
          </div>

          <input
            placeholder="Phone (optional)"
            className="border px-4 py-3 rounded w-full"
          />
        </div>

        {/* Shipping option */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Shipping options</h2>
          <div className="border p-4 rounded flex justify-between">
            <span>Free shipping</span>
            <span className="font-semibold">FREE</span>
          </div>
        </div>

        {/* Submit */}
        <button className="w-full bg-red-700 text-white py-4 rounded hover:bg-gray-800">
          Complete Order
        </button>
      </div>

      {/* RIGHT — SUMMARY */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h2 className="text-xl font-semibold">Order summary</h2>

        {cartItems.map(item => (
          <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
            <img
              src={Object.values(item.images || {})[0]}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                {item.selectedColor} • {item.selectedSize}
              </p>
            </div>
            <p className="font-medium">
              ฿{(item.finalPrice * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>฿{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>฿{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
