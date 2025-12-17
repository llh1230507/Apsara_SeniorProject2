import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import products from "../assets/productsData";

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q]);

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
              {matches.length === 0 ? (
                <div className="text-sm text-gray-500 px-1">No matches</div>
              ) : (
                <ul className="divide-y">
                  {matches.map((m) => (
                    <li key={`${m.category}-${m.id}`} className="py-2 flex items-center gap-3">
                      <img src={m.image} alt={m.name} className="h-10 w-10 rounded object-cover" />
                      <div className="flex-1">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{m.category}</div>
                      </div>
                      <div className="text-sm text-gray-700">${m.price}</div>
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
