import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  // 🔥 persist cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(
        item =>
          item.id === product.id &&
          item.selectedColor === product.selectedColor &&
          item.selectedSize === product.selectedSize &&
          item.selectedMaterial === product.selectedMaterial
      );

      if (existing) {
        return prev.map(item =>
          item === existing
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }

      return [...prev, product];
    });
  };



const removeFromCart = (targetItem) => {
  setCartItems(prev =>
    prev.filter(
      item =>
        !(
          item.id === targetItem.id &&
          item.selectedColor === targetItem.selectedColor &&
          item.selectedSize === targetItem.selectedSize &&
          item.selectedMaterial === targetItem.selectedMaterial
        )
    )
  );
};

const updateQuantity = (targetItem, amount) => {
  setCartItems(prev =>
    prev
      .map(item =>
        item.id === targetItem.id &&
        item.selectedColor === targetItem.selectedColor &&
        item.selectedSize === targetItem.selectedSize &&
        item.selectedMaterial === targetItem.selectedMaterial
          ? { ...item, quantity: item.quantity + amount }
          : item
      )
      .filter(item => item.quantity > 0)
  );
};


const clearCart = () => {
  setCartItems([]);
  localStorage.removeItem("cart");
};



  return (
    <CartContext.Provider
  value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}
>

      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
