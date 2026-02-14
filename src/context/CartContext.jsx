import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  const [cartLoading, setCartLoading] = useState(false);
  const [cartReady, setCartReady] = useState(false);

  // ✅ Cart Drawer UI State (NEW)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const getKey = (item) =>
    item.variantKey ||
    `${item.id}|color=${item.selectedColor}|size=${item.selectedSize}|material=${item.selectedMaterial}`;

  // ✅ helper: merge guest cart into firestore once on login
  const syncLocalCartToFirestore = async (uid) => {
    const local = JSON.parse(localStorage.getItem("cart")) || [];
    if (!local.length) return;

    await Promise.all(
      local.map(async (item) => {
        const key = getKey(item);
        const ref = doc(db, "users", uid, "cart", key);

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          const currentQty = snap.exists()
            ? Number(snap.data().quantity || 0)
            : 0;
          const addQty = Number(item.quantity || 0);

          tx.set(
            ref,
            { ...item, variantKey: key, quantity: currentQty + addQty },
            { merge: true }
          );
        });
      })
    );

    localStorage.removeItem("cart");
  };

  /* =============================
     🔥 On login: sync + subscribe
  ============================== */
  useEffect(() => {
    let unsub = null;

    const start = async () => {
      if (!user) {
        setCartLoading(false);
        setCartReady(true);
        setCartItems(JSON.parse(localStorage.getItem("cart")) || []);
        return;
      }

      setCartLoading(true);
      setCartReady(false);

      await syncLocalCartToFirestore(user.uid);

      const colRef = collection(db, "users", user.uid, "cart");
      unsub = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((d) => ({
            ...d.data(),
            variantKey: d.id,
          }));
          setCartItems(items);
          setCartLoading(false);
          setCartReady(true);
        },
        (err) => {
          console.error("Cart snapshot error:", err);
          setCartLoading(false);
          setCartReady(true);
        }
      );
    };

    start();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  /* =============================
     💾 Persist guest cart only
  ============================== */
  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  /* =============================
     ➕ Add to cart (OPEN DRAWER)
  ============================== */
  const addToCart = async (product, options = { openDrawer: true }) => {
    const key = getKey(product);

    // ✅ update UI immediately
    setCartItems((prev) => {
      const existing = prev.find((i) => getKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          getKey(i) === key
            ? {
                ...i,
                quantity:
                  Number(i.quantity || 0) + Number(product.quantity || 0),
              }
            : i
        );
      }
      return [...prev, { ...product, variantKey: key }];
    });

    // ✅ OPEN CART DRAWER (NEW)
    if (options?.openDrawer !== false) openCart();

    if (!user) return;

    const ref = doc(db, "users", user.uid, "cart", key);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const currentQty = snap.exists()
          ? Number(snap.data().quantity || 0)
          : 0;
        const addQty = Number(product.quantity || 0);

        tx.set(
          ref,
          { ...product, variantKey: key, quantity: currentQty + addQty },
          { merge: true }
        );
      });
    } catch (e) {
      console.error("addToCart transaction error:", e);
    }
  };

  const removeFromCart = async (targetItem) => {
    const key = getKey(targetItem);
    setCartItems((prev) => prev.filter((i) => getKey(i) !== key));

    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", key));
  };

  const updateQuantity = async (targetItem, amount) => {
    const key = getKey(targetItem);
    let nextQty = 0;

    setCartItems((prev) =>
      prev
        .map((i) => {
          if (getKey(i) !== key) return i;
          nextQty = Number(i.quantity || 0) + amount;
          return { ...i, quantity: nextQty };
        })
        .filter((i) => Number(i.quantity || 0) > 0)
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
    () => ({
      cartItems,
      cartLoading,
      cartReady,

      // actions
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,

      // ✅ drawer controls (NEW)
      isCartOpen,
      openCart,
      closeCart,
      setIsCartOpen, // optional
    }),
    [cartItems, cartLoading, cartReady, isCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
