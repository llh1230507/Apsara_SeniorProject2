// src/hooks/useProducts.js
// Module-level cache — survives component unmount/remount within the same session.
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

let _cache = null; // cached product array
let _promise = null; // in-flight fetch promise (prevents duplicate requests)

export function useProducts() {
  const [products, setProducts] = useState(_cache || []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    // Already cached — nothing to do
    if (_cache !== null) {
      setProducts(_cache);
      setLoading(false);
      return;
    }

    // Another component is already fetching — wait for the same promise
    if (_promise) {
      _promise.then((data) => {
        setProducts(data);
        setLoading(false);
      });
      return;
    }

    // First fetch
    _promise = (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "products"), limit(60)),
        );
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        _cache = data;
        return data;
      } catch (err) {
        console.error("Failed to fetch products:", err);
        _cache = [];
        return [];
      } finally {
        _promise = null;
      }
    })();

    _promise.then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return { products, loading };
}

/** Call this if you ever need to force a fresh fetch (e.g. after admin edits a product) */
export function invalidateProductsCache() {
  _cache = null;
  _promise = null;
}
