import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

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

function Products() {
  const categories = [
    { name: "Wood Sculpture", slug: "wood", products: [1, 2, 3, 4, 5, 6] },
    { name: "Stone Sculpture", slug: "stone", products: [1, 2, 3, 4, 5, 6] },
    { name: "Metal Sculpture", slug: "metal", products: [1, 2, 3, 4, 5, 6] },
  ];

  return (
    <div className="p-8 text-black">
      <h1 className="text-4xl font-bold mb-8">Products</h1>

      {categories.map((category, idx) => (
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

          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-6 min-w-max">
              {category.products.map((prod, i) => (
                <Reveal key={prod} delay={i * 80}>
                  <div className="group border rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer bg-white">
                    <div className="rounded-md overflow-hidden mb-4">
                      <img
                        src={`/product${prod}.jpg`}
                        alt={`Product ${prod}`}
                        className="h-32 w-full object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-lg font-medium">Product {prod}</p>
                    <p className="text-gray-600">$100</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Products;
