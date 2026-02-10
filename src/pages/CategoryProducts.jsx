import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

/* ---------- Fade-in (same vibe as yours) ---------- */
function FadeInOnScroll({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

const CATEGORY_META = {
  wood: { title: "Wood Sculptures", accent: "bg-[#6b3410]" },
  stone: { title: "Stone Sculptures", accent: "bg-gray-800" },
  furniture: { title: "Furniture", accent: "bg-blue-900" },
  metal: { title: "Metal Sculptures", accent: "bg-zinc-800" },
};

export default function CategoryProducts() {
  const { category } = useParams();

  const meta = CATEGORY_META[category] || {
    title: `${category} Products`,
    accent: "bg-black",
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch only this category from Firestore
        const q = query(
          collection(db, "products"),
          where("category", "==", category)
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch category products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const sorted = useMemo(() => {
    const arr = [...products];

    arr.sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();

      // IMPORTANT: admin uses basePrice (fallback to price)
      const aPrice = Number(a.basePrice ?? a.price ?? 0);
      const bPrice = Number(b.basePrice ?? b.price ?? 0);

      const v = sortKey === "name" ? aName.localeCompare(bName) : aPrice - bPrice;
      return sortOrder === "asc" ? v : -v;
    });

    return arr;
  }, [products, sortKey, sortOrder]);

  if (loading) return <p className="pt-24 p-8">Loading products...</p>;

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">{meta.title}</h1>

        {/* Sort controls */}
        <div className="flex gap-4 mb-8">
          <select
            className="border px-3 py-2 rounded"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>

          <button
            className={`${meta.accent} text-white px-4 py-2 rounded`}
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "Asc ↑" : "Desc ↓"}
          </button>
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
            No products in this category yet.
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {sorted.map((p) => {
            const price = Number(p.basePrice ?? p.price ?? 0);

            // Your images are stored as object: { colorName: url }
            const imageUrl =
              Object.values(p.images || {})[0] || p.imageUrl || "";

            return (
              <FadeInOnScroll key={p.id}>
                <div className="bg-white rounded-xl shadow hover:shadow-xl overflow-hidden">
                  <div className="h-64 w-full bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={p.name}
                        className="h-64 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-64 w-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    <p className="text-gray-700">${price}</p>

                    <NavLink
                      to={`/products/${category}/${p.id}`}
                      className={`block mt-4 ${meta.accent} text-white py-2 rounded text-center`}
                    >
                      View Product
                    </NavLink>
                  </div>
                </div>
              </FadeInOnScroll>
            );
          })}
        </div>
      </div>
    </div>
  );
}
