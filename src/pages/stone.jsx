import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";

function FadeInOnScroll({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.1 }
    );
    ref.current && observer.observe(ref.current);
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

function Stone() {
  const products = [
    { id: 1, name: "Wooden Apsara", price: 180, image: "/product1.jpg" },
    { id: 2, name: "Carved Wooden Buddha", price: 220, image: "/product2.jpg" },
    { id: 3, name: "Khmer Wood Mask", price: 150, image: "/product3.jpg" },
    { id: 4, name: "Engraved Wooden Lotus", price: 95, image: "/product4.jpg" },
    { id: 5, name: "Sacred Tree Relief", price: 260, image: "/product5.jpg" },
    { id: 6, name: "Angkor Face Panel", price: 199, image: "/product6.jpg" },
    { id: 7, name: "Mini Apsara Figurine", price: 75, image: "/banner.jpg" },
    {
      id: 8,
      name: "Temple Guardian Carving",
      price: 310,
      image: "/banner2.jpg",
    },
    { id: 9, name: "Khmer Script Plaque", price: 120, image: "/banner3.jpg" },
  ];

  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const v =
        sortKey === "name" ? a.name.localeCompare(b.name) : a.price - b.price;
      return sortOrder === "asc" ? v : -v;
    });
  }, [sortKey, sortOrder]);

  return (
    <div className="pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">Stone Sculptures</h1>
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
            className="bg-[#6b3410] text-white px-4 py-2 rounded"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "Asc ↑" : "Desc ↓"}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {sorted.map((p) => (
            <FadeInOnScroll key={p.id}>
              <div className="bg-white rounded-xl shadow hover:shadow-xl">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-64 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p>${p.price}</p>
                  <NavLink
                    to={`/products/wood/${p.id}`}
                    className="block mt-4 bg-[#6b3410] text-white py-2 rounded text-center"
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

export default Stone;
