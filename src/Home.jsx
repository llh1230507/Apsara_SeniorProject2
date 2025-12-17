import { useEffect, useRef, useState } from "react";

function ProductCard({ product }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group
        transform duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="h-64 w-full overflow-hidden">
        <img
          src={product.image}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
          alt={product.name}
        />
      </div>

      <div className="p-5">
        <h3 className="text-xl font-semibold">{product.name}</h3>
        <p className="text-gray-600 mt-1 text-lg">${product.price}</p>

        <button className="mt-4 w-full bg-[#8b4513] text-white py-2 rounded-lg hover:bg-[#6b3410] transition">
          View Product
        </button>
      </div>
    </div>
  );
}

function Home() {
  const products = [
    { id: 1, name: "Wood Sculpture", price: 120, image: "/product1.jpg" },
    { id: 2, name: "Stone Buddha Statue", price: 250, image: "/product2.jpg" },
    {
      id: 3,
      name: "Metal Apsara Figurine",
      price: 180,
      image: "/product3.jpg",
    },
    {
      id: 4,
      name: "Hand-Carved Wooden Elephant",
      price: 90,
      image: "/product1.jpg",
    },
    {
      id: 5,
      name: "Marble Mini Sculpture",
      price: 140,
      image: "/product2.jpg",
    },
    { id: 6, name: "Bronze Khmer Head", price: 300, image: "/product3.jpg" },
  ];

  // Banner slideshow
  const bannerImages = ["/banner.jpg", "/banner2.jpg", "/banner3.jpg"];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerImages.length);
    }, 10000); // 10s
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  return (
    <div className="text-black">
      <div className="relative h-[450px] w-full overflow-hidden">
        {bannerImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${src}')` }}
          >
            <div className="h-full w-full bg-cover bg-center flex items-center justify-center">
              <h1 className="text-5xl font-bold text-white drop-shadow-2xl">
                Welcome to Apsara
              </h1>
            </div>
          </div>
        ))}

        {/* Optional dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setCurrent(idx)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                idx === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-semibold mt-10 text-center">
          Featured Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 py-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
