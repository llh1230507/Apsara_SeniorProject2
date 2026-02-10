import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // ✅ Load favorites from Firestore when logged in
  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);

      if (user) {
        try {
          const snap = await getDocs(collection(db, "users", user.uid, "favorites"));
          const favs = snap.docs.map((d) => d.data());
          setFavorites(favs);
        } catch (e) {
          console.error("Load favorites error:", e);
          setFavorites([]);
        } finally {
          setLoadingFavorites(false);
        }
        return;
      }

      // Guest -> local
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavorites(stored);
      setLoadingFavorites(false);
    };

    loadFavorites();
  }, [user]);

  // ✅ Persist to localStorage ONLY when logged out
  useEffect(() => {
    if (!user) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const getId = (p) => p?.id || p?.productId;

  const isFavorite = (productId) =>
    favorites.some((p) => getId(p) === productId);

  const addFavorite = async (product) => {
    if (!product?.id) return;

    // optimistic UI
    setFavorites((prev) => {
      if (prev.some((p) => getId(p) === product.id)) return prev;
      return [...prev, product];
    });

    if (!user) return; // guest -> local only

    try {
      await setDoc(
        doc(db, "users", user.uid, "favorites", product.id),
        { ...product, productId: product.id },
        { merge: true }
      );
    } catch (e) {
      console.error("Add favorite error:", e);
    }
  };

  const removeFavorite = async (productId) => {
    // optimistic UI
    setFavorites((prev) => prev.filter((p) => getId(p) !== productId));

    if (!user) return; // guest -> local only

    try {
      await deleteDoc(doc(db, "users", user.uid, "favorites", productId));
    } catch (e) {
      console.error("Remove favorite error:", e);
    }
  };

  const toggleFavorite = async (product) => {
    const id = product?.id;
    if (!id) return;

    if (isFavorite(id)) {
      await removeFavorite(id);
    } else {
      await addFavorite(product);
    }
  };

  const value = useMemo(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      loadingFavorites,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    }),
    [favorites, loadingFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
