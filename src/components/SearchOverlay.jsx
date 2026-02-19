import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

// helper to show an image
const getThumb = (p) => p?.imageUrl || Object.values(p?.images || {})[0] || "";

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef(null);

  // focus input
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC close
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // fetch products from Firestore when overlay opens (or fetch once on mount)
  useEffect(() => {
    if (!open) return;
    if (allProducts.length) return; // already loaded

    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "products"), limit(50)));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllProducts(data);
      } catch (err) {
        console.error("Search products load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, allProducts.length]);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allProducts
      .filter((p) => String(p?.name || "").toLowerCase().includes(term))
      .slice(0, 6);
  }, [q, allProducts]);

  function submit() {
    const term = q.trim();
    if (!term) return;
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-2xl p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              aria-label="Search products"
              placeholder="Search products..."
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              onClick={submit}
              className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800"
              type="button"
            >
              Search
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
              type="button"
            >
              Cancel
            </button>
          </div>

          {q && (
            <div className="mt-4">
              {loading ? (
                <div className="text-sm text-gray-500 px-1">Loading…</div>
              ) : matches.length === 0 ? (
                <div className="text-sm text-gray-500 px-1">No matches</div>
              ) : (
                <ul className="divide-y">
                  {matches.map((m) => (
                    <li
                      key={m.id}
                      className="py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded px-2"
                      onClick={() => {
                        onClose?.();
                        // ✅ Your ProductDetail uses doc(db,"products",id)
                        navigate(`/products/${m.category}/${m.id}`);
                      }}
                    >
                      <img
                        src={getThumb(m)}
                        alt={m.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {m.category}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        ${Number(m.price || 0).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchOverlay;
