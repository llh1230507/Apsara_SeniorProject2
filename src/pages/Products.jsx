import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/* ---------- Reveal Animation ---------- */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`opacity-0 translate-y-4 transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ---------- Products Page ---------- */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Group products by category
  const grouped = {
    wood: products.filter((p) => p.category === "wood"),
    stone: products.filter((p) => p.category === "stone"),
    furniture: products.filter((p) => p.category === "furniture"),
  };

  if (loading) {
    return <p className="p-8 text-lg">Loading products...</p>;
  }

  return (
    <div className="p-8 text-black">
      <h1 className="text-4xl font-bold mb-8">Products</h1>

      {[
        { name: "Wood Sculpture", slug: "wood" },
        { name: "Stone Sculpture", slug: "stone" },
        { name: "Furniture", slug: "furniture" },
      ].map((category, idx) => (
        <div key={idx} className="mb-12">
          <Reveal>
            <Link
              to={`/products/${category.slug}`}
              className="text-2xl font-semibold mb-4 flex items-center gap-2 hover:underline"
            >
              {category.name}
              <span className="text-gray-500">→</span>
            </Link>
          </Reveal>

          {grouped[category.slug].length === 0 ? (
            <p className="text-gray-500">No products available.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-6 min-w-max">
                {grouped[category.slug].map((product, i) => (
                  <Reveal key={product.id} delay={i * 80}>
                    <Link
                      to={`/products/${product.category}/${product.id}`}
                      className="group border  p-6 shadow-sm hover:shadow-lg transition cursor-pointer bg-white block"
                    >
                      <div className="rounded-md overflow-hidden mb-4">
                        <img
  src={Object.values(product.images || {})[0]}
  alt={product.name}
  className="h-32 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
  loading="lazy"
/>

                      </div>

                      <p className="text-lg font-medium">{product.name}</p>
                      <p className="text-gray-600">${product.price}</p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}