import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const handleCheckout = () => {
    onClose();

    if (!user) {
      // ✅ must use "redirect" (not redirectTo)
      openAuth({ mode: "login", redirect: "/checkout" });
      return;
    }

    navigate("/checkout");
  };

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white z-50 shadow-xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Your cart ({totalItems} items)</h2>
          <button onClick={onClose} className="text-2xl" type="button">
            ×
          </button>
        </div>

        <div
          className={`p-12 flex-1 ${
            !cartItems.length
              ? "flex items-center justify-center"
              : "space-y-6 overflow-y-auto"
          }`}
        >
          {!cartItems.length && (
            <div className="text-center space-y-4">
              <p className="text-3xl font-bold mb-9">Your cart is empty</p>
              <NavLink
                to="/products"
                onClick={onClose}
                className="bg-red-700 text-white px-6 py-3 rounded"
              >
                Browse Products
              </NavLink>
            </div>
          )}

          {cartItems.map((item) => {
            // ✅ STOCK LIMIT LOGIC PER ITEM
            const maxStock = Number(item.stock ?? Infinity);
            const atMax = Number(item.quantity || 0) >= maxStock;

            return (
              <div
                key={
                  item.variantKey ||
                  `${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedMaterial}`
                }
                className="flex gap-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">${Number(item.price || 0).toFixed(2)}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item, -1)}
                      className="border px-2"
                      type="button"
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => updateQuantity(item, 1)}
                      disabled={atMax}
                      className={`border px-2 ${
                        atMax ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      type="button"
                      title={atMax ? `Max stock: ${maxStock}` : "Add one more"}
                    >
                      +
                    </button>
                  </div>

                  {/* Optional: show stock info */}
                  {Number.isFinite(maxStock) && (
                    <p className="text-xs text-gray-500 mt-1">Stock: {maxStock}</p>
                  )}

                  <button
                    onClick={() => removeFromCart(item)}
                    className="text-sm text-gray-500 underline mt-2"
                    type="button"
                  >
                    Remove item
                  </button>
                </div>

                <p className="font-medium">
                  ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <p className="text-sm text-gray-500">
              Shipping and discounts calculated at checkout.
            </p>

            <NavLink
              to="/cart"
              onClick={onClose}
              className="block text-center border py-3 rounded"
            >
              Cart
            </NavLink>

            <button
              onClick={handleCheckout}
              className="block w-full text-center bg-black text-white py-3 rounded"
              type="button"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
