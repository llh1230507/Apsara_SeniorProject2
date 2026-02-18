// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";
import { FaHammer, FaGem, FaGlobeAsia } from "react-icons/fa";

/* ---------- Helpers ---------- */
const getThumb = (p) => p?.imageUrl || Object.values(p?.images || {})[0] || "";
const money = (n) => Number(n || 0).toFixed(2);

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
      { threshold: 0.15 },
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

/* ---------- Product Card ---------- */
function ProductCard({ product }) {
  const img = getThumb(product);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group border">
      <div className="h-56 w-full overflow-hidden bg-gray-50">
        {img ? (
          <img
            src={img}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
            alt={product.name}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 capitalize">{product.category}</p>
        <h3 className="font-semibold text-lg mt-1 line-clamp-1">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-red-700 font-semibold">${money(product.price)}</p>

          <Link
            to={`/products/${product.category}/${product.id}`}
            className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- Home ---------- */
export default function Home() {
  const navigate = useNavigate();

  const bannerImages = ["/banner.jpg", "/banner2.jpg", "/banner3.jpg"];
  const [current, setCurrent] = useState(0);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto slideshow
  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerImages.length);
    }, 8000);
    return () => clearInterval(t);
  }, [bannerImages.length]);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Pull some products (you can increase limit later)
        const qy = query(collection(db, "products"), limit(60));
        const snap = await getDocs(qy);

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Pick 1 product per category for Featured Products
  const featured = useMemo(() => {
    const byCat = {
      wood: products.filter((p) => p.category === "wood"),
      stone: products.filter((p) => p.category === "stone"),
      furniture: products.filter((p) => p.category === "furniture"),
    };

    // simple pick: first item (you can change to "highest price" or "newest" later)
    const oneEach = [
      byCat.wood?.[0],
      byCat.stone?.[0],
      byCat.furniture?.[0],
    ].filter(Boolean);

    return oneEach;
  }, [products]);

  const handleBannerClick = () => {
    navigate("/products");
  };

  return (
    <div className="text-black">
      {/* ===== HERO / BANNER (CLICKABLE) ===== */}
      <div
        className="relative h-[720px] w-full overflow-hidden cursor-pointer group"
        onClick={handleBannerClick}
      >
        {bannerImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-[4000ms] ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('${src}')`,
              }}
            />
          </div>
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center text-white max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold drop-shadow-2xl">
              Welcome to Apsara
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/90 font-light">
              Discover authentic handcrafted masterpieces for your home.{" "}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/products");
              }}
              className="mt-8 px-8 py-3 border border-white text-white rounded-full 
                   hover:bg-white hover:text-black transition-all duration-300"
            >
              Explore Collection
            </button>
          </div>
        </div>

        {/* Dots */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setCurrent(idx)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                idx === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* ===== FEATURES STRIP ===== */}
      <div className="bg-[#f3ebe2]">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-white grid place-items-center shadow-sm">
              <FaHammer className="text-red-700" />
            </div>
            <h3 className="mt-4 font-semibold">Handcrafted Quality</h3>
            <p className="mt-2 text-sm text-gray-600">
              Each piece is meticulously crafted by master artisans using
              traditional techniques.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-white grid place-items-center shadow-sm">
              <FaGem className="text-red-700" />
            </div>
            <h3 className="mt-4 font-semibold">Authentic Materials</h3>
            <p className="mt-2 text-sm text-gray-600">
              Sourced from the finest wood, stone, and metals for lasting
              beauty.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-white grid place-items-center shadow-sm">
              <FaGlobeAsia className="text-red-700" />
            </div>
            <h3 className="mt-4 font-semibold">Global Shipping</h3>
            <p className="mt-2 text-sm text-gray-600">
              We deliver your art to your doorstep, anywhere in the world.
            </p>
          </div>
        </div>
      </div>

      {/* ===== FEATURED PRODUCTS ===== */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Featured Products</h2>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading...</p>
        ) : featured.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No products available yet. Add products from Admin.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/products"
            className="px-5 py-3 rounded-lg border hover:bg-gray-50 transition font-medium"
          >
            View All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
