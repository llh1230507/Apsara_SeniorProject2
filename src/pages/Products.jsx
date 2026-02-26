// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const PAGE_SIZE = 12;

const money = (n) => Number(n || 0).toFixed(2);

const getThumb = (p) =>
  p?.imageUrl || Object.values(p?.images || {})[0] || null;

const CATEGORY_LABELS = [
  { key: "all", label: "All Products" },
  { key: "wood", label: "Wood Sculptures" },
  { key: "stone", label: "Stone Art" },
  { key: "furniture", label: "Furniture" },
];

const PRICE_MAX = 5000;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  // Build Firestore query based on category
  const buildQuery = useCallback(
    (afterDoc = null) => {
      const constraints = [orderBy("__name__"), limit(PAGE_SIZE)];
      if (category !== "all")
        constraints.unshift(where("category", "==", category));
      if (afterDoc) constraints.push(startAfter(afterDoc));
      return query(collection(db, "products"), ...constraints);
    },
    [category],
  );

  // Initial / category-change fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setHasMore(true);
    lastDocRef.current = null;

    const run = async () => {
      try {
        const snap = await getDocs(buildQuery());
        if (cancelled) return;
        lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
        setHasMore(snap.docs.length === PAGE_SIZE);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [buildQuery]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const snap = await getDocs(buildQuery(lastDocRef.current));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === PAGE_SIZE);
      setProducts((prev) => [
        ...prev,
        ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ]);
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setCategory("all");
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setInStockOnly(false);
    setSortBy("featured");
  };

  // Client-side price/stock/sort filters on whatever is loaded
  const filtered = useMemo(() => {
    let list = [...products];

    if (inStockOnly) list = list.filter((p) => Number(p.stock ?? 0) > 0);

    if (priceMin > 0 || priceMax < PRICE_MAX) {
      list = list.filter((p) => {
        const price = Number(p.price || 0);
        return price >= priceMin && price <= priceMax;
      });
    }

    if (sortBy === "priceAsc")
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sortBy === "priceDesc")
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    else if (sortBy === "nameAsc")
      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );

    return list;
  }, [products, inStockOnly, priceMin, priceMax, sortBy]);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            <aside className="hidden lg:block">
              <div className="border rounded-xl p-5 space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </aside>
            <main>
              <div className="h-6 bg-gray-200 rounded w-40 mb-8 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border rounded overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          {/* ===== SIDEBAR ===== */}
          <aside
            className={`${filtersOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-24 h-fit`}
          >
            <div className="border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs tracking-widest text-gray-500 uppercase">
                    Categories
                  </p>
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
                    <label
                      key={c.key}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
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

              {/* Price Range Slider */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-900">
                  Price Range
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>${priceMin}</span>
                    <span>
                      {priceMax >= PRICE_MAX
                        ? `$${PRICE_MAX}+`
                        : `$${priceMax}`}
                    </span>
                  </div>
                  <div className="relative flex items-center h-5">
                    {/* Track background */}
                    <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
                    {/* Active range highlight */}
                    <div
                      className="absolute h-1.5 bg-red-600 rounded-full"
                      style={{
                        left: `${(priceMin / PRICE_MAX) * 100}%`,
                        right: `${100 - (priceMax / PRICE_MAX) * 100}%`,
                      }}
                    />
                    {/* Min thumb */}
                    <input
                      type="range"
                      min={0}
                      max={PRICE_MAX}
                      step={10}
                      value={priceMin}
                      onChange={(e) =>
                        setPriceMin(
                          Math.min(Number(e.target.value), priceMax - 10),
                        )
                      }
                      className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-red-700
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow"
                      style={{ zIndex: priceMin >= priceMax - 10 ? 5 : 3 }}
                    />
                    {/* Max thumb */}
                    <input
                      type="range"
                      min={0}
                      max={PRICE_MAX}
                      step={10}
                      value={priceMax}
                      onChange={(e) =>
                        setPriceMax(
                          Math.max(Number(e.target.value), priceMin + 10),
                        )
                      }
                      className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-red-700
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow"
                      style={{ zIndex: 4 }}
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-900">
                  Availability
                </p>
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
                  Showing {filtered.length} result
                  {filtered.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className="lg:hidden border rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {filtersOpen ? "Hide Filters" : "Filters"}
                </button>

                <label className="text-sm text-gray-600 hidden sm:block">
                  Sort by:
                </label>
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
                      {getThumb(p) ? (
                        <img
                          src={getThumb(p)}
                          alt={p.name}
                          className="h-full w-full object-cover hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-gray-500 capitalize">
                        {p.category || "uncategorized"}
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {p.name}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">
                          ${money(p.price)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${Number(p.stock ?? 0) > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {Number(p.stock ?? 0) > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
