// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { FaHammer, FaGem, FaGlobeAsia, FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
    <Link
      to={`/products/${product.category}/${product.id}`}
      className="bg-white shadow-sm hover:shadow-lg transition overflow-hidden group border block"
    >
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
        
      </div>
    </Link>
  );
}

/* ---------- Home ---------- */
export default function Home() {
  const navigate = useNavigate();

  const bannerImages = ["/banner.jpg", "/banner2.jpg", "/banner3.jpg"];
  const [current, setCurrent] = useState(0);

  const { products, loading } = useProducts();

  // Auto slideshow
  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerImages.length);
    }, 8000);
    return () => clearInterval(t);
  }, [bannerImages.length]);

  // Pick up to 2 products per category for Featured Products (6 total)
  const featured = useMemo(() => {
    const byCat = {
      wood: products.filter((p) => p.category === "wood"),
      stone: products.filter((p) => p.category === "stone"),
      furniture: products.filter((p) => p.category === "furniture"),
    };
    return [
      ...byCat.wood.slice(0, 2),
      ...byCat.stone.slice(0, 2),
      ...byCat.furniture.slice(0, 2),
    ];
  }, [products]);

  const scrollRef = useRef(null);
  const scroll = useCallback((dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  }, []);

  const handleBannerClick = () => {
    navigate("/products");
  };

  return (
    <div className="text-black">
      {/* ===== HERO / BANNER (CLICKABLE) ===== */}
      <div
        className="relative h-[60vh] md:h-[720px] w-full overflow-hidden cursor-pointer group"
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
              Sourced from the finest materials for long lasting beauty.
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
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-14">
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
          <div className="relative mt-10">
            {/* Left arrow */}
            <button
              onClick={() => scroll(-1)}
              className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full w-10 h-10 items-center justify-center shadow hover:bg-gray-100 transition"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="text-gray-600 text-sm" />
            </button>

            {/* Scrollable row */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
            >
              {featured.map((p) => (
                <div key={p.id} className="min-w-[260px] max-w-[260px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => scroll(1)}
              className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full w-10 h-10 items-center justify-center shadow hover:bg-gray-100 transition"
              aria-label="Scroll right"
            >
              <FaChevronRight className="text-gray-600 text-sm" />
            </button>
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
