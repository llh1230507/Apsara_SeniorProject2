import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";

function FadeInOnScroll({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

function Furniture() {
  const products = [
    { id: 1, name: "Bronze Apsara Figurine", price: 280, image: "/banner.jpg" },
    { id: 2, name: "Metal Khmer Head", price: 320, image: "/banner2.jpg" },
    { id: 3, name: "Brass Temple Sculpture", price: 250, image: "/banner3.jpg" },
    { id: 4, name: "Copper Apsara Dancer", price: 295, image: "/banner2.jpg" },
    { id: 5, name: "Brass Elephant Figurine", price: 340, image: "/banner3.jpg" },
    { id: 6, name: "Silver Khmer Mask", price: 410, image: "/banner.jpg" },
    { id: 7, name: "Nickel Temple Bell", price: 220, image: "/banner2.jpg" },
    { id: 8, name: "Iron Guardian Deity", price: 260, image: "/banner3.jpg" },
    { id: 9, name: "Bronze Apsara Relief", price: 370, image: "/banner.jpg" },
  ];

  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const v =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : a.price - b.price;
      return sortOrder === "asc" ? v : -v;
    });
  }, [sortKey, sortOrder]);

  return (
    <div className="pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">Furniture</h1>

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
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            className="bg-[#8b4513] text-white px-4 py-2 rounded"
          >
            {sortOrder === "asc" ? "Asc ↑" : "Desc ↓"}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {sorted.map((p) => (
            <FadeInOnScroll key={p.id}>
              <div className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-64 w-full object-cover"
                />

                <div className="p-5">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="text-gray-600">${p.price}</p>

                  <NavLink
                    to={`/products/furniture/${p.id}`}
                    className="block mt-4 bg-[#8b4513] text-white py-2 rounded text-center hover:bg-[#6b3410]"
                  >
                    View Product
                  </NavLink>
                </div>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Furniture;