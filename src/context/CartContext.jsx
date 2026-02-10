import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  // helper key (stable id for a variant)
  const getKey = (item) =>
    item.variantKey ||
    `${item.id}|color=${item.selectedColor}|size=${item.selectedSize}|material=${item.selectedMaterial}`;

  // ✅ Load cart from Firestore when user logs in
  useEffect(() => {
  if (!user) return;

  const colRef = collection(db, "users", user.uid, "cart");

  const unsub = onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({ ...d.data(), variantKey: d.id }));
      setCartItems(items);
    },
    (err) => console.error("Cart snapshot error:", err)
  );

  return () => unsub();
}, [user]);


  // ✅ Persist to localStorage ONLY when logged out
  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = async (product) => {
  const key = getKey(product);

  // guest -> local
  if (!user) {
    setCartItems((prev) => {
      const existing = prev.find((item) => getKey(item) === key);
      if (existing) {
        return prev.map((item) =>
          getKey(item) === key
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prev, { ...product, variantKey: key }];
    });
    return;
  }

  // logged-in -> Firestore (source of truth)
  const ref = doc(db, "users", user.uid, "cart", key);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);

      if (!snap.exists()) {
        tx.set(ref, { ...product, variantKey: key });
        return;
      }

      const current = snap.data();
      const nextQty = Number(current.quantity || 0) + Number(product.quantity || 0);

      tx.set(ref, { ...current, ...product, variantKey: key, quantity: nextQty }, { merge: true });
    });
  } catch (e) {
    console.error("addToCart transaction error:", e);
  }
};


  const removeFromCart = async (targetItem) => {
    const key = getKey(targetItem);

    setCartItems((prev) => prev.filter((item) => getKey(item) !== key));

    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "cart", key));
  };

  const updateQuantity = async (targetItem, amount) => {
    const key = getKey(targetItem);

    let nextQty = 0;

    setCartItems((prev) =>
      prev
        .map((item) => {
          if (getKey(item) !== key) return item;
          nextQty = item.quantity + amount;
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );

    if (!user) return;

    if (nextQty <= 0) {
      await deleteDoc(doc(db, "users", user.uid, "cart", key));
    } else {
      await setDoc(
        doc(db, "users", user.uid, "cart", key),
        { ...targetItem, variantKey: key, quantity: nextQty },
        { merge: true }
      );
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem("cart");

    if (!user) return;

    const snap = await getDocs(collection(db, "users", user.uid, "cart"));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  const value = useMemo(
    () => ({ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
