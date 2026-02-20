// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const money = (n) => Number(n || 0).toFixed(2);

const getThumb = (p) => {
  return (
    p?.imageUrl ||
    Object.values(p?.images || {})[0] ||
    "https://via.placeholder.com/600x450?text=No+Image"
  );
};

const CATEGORY_LABELS = [
  { key: "all", label: "All Products" },
  { key: "wood", label: "Wood Sculptures" },
  { key: "stone", label: "Stone Art" },
  { key: "furniture", label: "Furniture" },
];

// you can adjust these ranges any time
const PRICE_RANGES = [
  { key: "under100", label: "Under $100", min: 0, max: 100 },
  { key: "100to500", label: "$100 - $500", min: 100, max: 500 },
  { key: "500plus", label: "$500+", min: 500, max: Infinity },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [category, setCategory] = useState("all");
  const [selectedRanges, setSelectedRanges] = useState(new Set());
  const [inStockOnly, setInStockOnly] = useState(false);

  // sort
  const [sortBy, setSortBy] = useState("featured"); // featured | priceAsc | priceDesc | nameAsc

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(query(collection(db, "products"), limit(50)));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleRange = (key) => {
    setSelectedRanges((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = [...products];

    // category filter
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    // availability filter
    if (inStockOnly) {
      list = list.filter((p) => Number(p.stock ?? 0) > 0);
    }

    // price ranges filter (if none selected, allow all)
    if (selectedRanges.size > 0) {
      list = list.filter((p) => {
        const price = Number(p.price || 0);
        for (const r of PRICE_RANGES) {
          if (!selectedRanges.has(r.key)) continue;
          if (price >= r.min && price < r.max) return true;
        }
        return false;
      });
    }

    // sort
    if (sortBy === "priceAsc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceDesc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "nameAsc") {
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else {
      // "featured" -> keep Firestore order
    }

    return list;
  }, [products, category, inStockOnly, selectedRanges, sortBy]);

  const clearFilters = () => {
    setCategory("all");
    setSelectedRanges(new Set());
    setInStockOnly(false);
    setSortBy("featured");
  };

  if (loading) {
    return <div className="p-10 text-gray-600">Loading products…</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          {/* ===== SIDEBAR ===== */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">Categories</p>
                  <h2 className="text-lg font-semibold mt-1">Filter</h2>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  Reset
                </button>
              </div>

              {/* Category */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Category</p>

                <div className="mt-3 space-y-2">
                  {CATEGORY_LABELS.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={c.key}
                        checked={category === c.key}
                        onChange={() => setCategory(c.key)}
                        className="accent-red-700"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-900">Price Range</p>
                <div className="mt-3 space-y-2">
                  {PRICE_RANGES.map((r) => (
                    <label key={r.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRanges.has(r.key)}
                        onChange={() => toggleRange(r.key)}
                        className="accent-red-700"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-900">Availability</p>
                <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-red-700"
                  />
                  In Stock
                </label>
              </div>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">All Products</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="nameAsc">Name: A → Z</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="mt-10 border rounded-xl p-10 text-gray-600">
                No products match your filters.
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {filtered.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.category}/${p.id}`}
                    className="border overflow-hidden bg-white hover:shadow-lg transition block"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img
                        src={getThumb(p)}
                        alt={p.name}
                        className="h-full w-full object-cover hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-gray-500 capitalize">
                        {p.category || "uncategorized"}
                      </div>

                      <div className="mt-1 font-semibold text-gray-900">{p.name}</div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">
                          ${money(p.price)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            Number(p.stock ?? 0) > 0
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {Number(p.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
