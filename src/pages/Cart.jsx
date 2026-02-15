import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";


function Cart() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
const { user } = useAuth();
const { openAuth } = useAuthModal();

const handleCheckout = () => {
  if (!user) {
    openAuth({ mode: "login", redirect: "/checkout" });
 // ✅ only checkout forces /checkout
    return;
  }
  navigate("/checkout");
};


  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (!cartItems.length) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add the product you love to the cart</p>
        <NavLink
          to="/products"
          className="bg-red-700 text-white px-6 py-3 rounded"
        >
          Browse Products
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.map((item) => (
        <div
          key={item.variantKey || `${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedMaterial}`}

          className="flex gap-6 bg-white p-5 rounded-xl shadow mb-6"
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-28 h-28 object-cover rounded-lg"
          />

          <div className="flex-1">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-sm text-gray-500">
              {item.category} • {item.selectedColor} • {item.selectedSize} • {item.selectedMaterial}
            </p>

            <p className="text-red-700 font-semibold mt-1">${item.price}</p>

            <div className="flex items-center gap-4 mt-4">
  <button type="button" onClick={() => updateQuantity(item, -1)}>
    −
  </button>

  <span>{item.quantity}</span>

  {(() => {
    const maxStock = Number(item.stock ?? Infinity);
    const atMax = Number(item.quantity || 0) >= maxStock;

    return (
      <>
        <button
          type="button"
          onClick={() => updateQuantity(item, 1)}
          disabled={atMax}
          className={atMax ? "opacity-40 cursor-not-allowed" : ""}
          title={atMax ? `Max stock: ${maxStock}` : "Add one more"}
        >
          +
        </button>

        {Number.isFinite(maxStock) && (
          <span className="text-xs text-gray-500">Stock: {maxStock}</span>
        )}
      </>
    );
  })()}

  <button
    type="button"
    onClick={() => removeFromCart(item)}
    className="ml-auto text-red-500"
  >
    Remove
  </button>
</div>

          </div>
        </div>
      ))}

      <div className="mt-8 flex justify-end flex-col items-end gap-4">
        <h2 className="text-xl font-bold">Total: ${total.toFixed(2)}</h2>

        <button
   onClick={handleCheckout}
   className="bg-red-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-800 transition"
 >
   Proceed to Checkout
</button>
      </div>
    </div>
  );
}

export default Cart;
