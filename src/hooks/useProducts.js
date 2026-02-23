// src/hooks/useProducts.js
// Fetch starts immediately at module import time — before React renders anything.
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

let _cache = null;   // cached product array
let _promise = null; // in-flight fetch promise

function startFetch() {
  if (_cache !== null || _promise !== null) return;

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
}

// Kick off the fetch the moment this module is imported (before any React render)
startFetch();

export function useProducts() {
  const [products, setProducts] = useState(_cache || []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    // Already cached — no fetch needed
    if (_cache !== null) {
      setProducts(_cache);
      setLoading(false);
      return;
    }

    // Fetch already in-flight — just wait for it
    if (_promise) {
      _promise.then((data) => {
        setProducts(data);
        setLoading(false);
      });
      return;
    }

    // Fallback: start a fresh fetch (should rarely happen)
    startFetch();
    _promise.then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return { products, loading };
}

/** Force a fresh fetch — call this after admin adds/edits/deletes a product */
export function invalidateProductsCache() {
  _cache = null;
  _promise = null;
}
