import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";


function FadeInOnScroll({ children }) {
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
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-700 ease-out transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

function Metal() {
  const metalProducts = [
    {
      id: 1,
      name: "Bronze Apsara Figurine",
      price: 280,
      image: "/product1.jpg",
    },
    { id: 2, name: "Metal Khmer Head", price: 320, image: "/product2.jpg" },
    {
      id: 3,
      name: "Brass Temple Sculpture",
      price: 250,
      image: "/product3.jpg",
    },
    {
      id: 4,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/banner.jpg",
    },
    {
      id: 5,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/product4.jpg",
    },
    {
      id: 6,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/product5.jpg",
    },
    {
      id: 7,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/product6.jpg",
    },
    {
      id: 8,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/banner2.jpg",
    },
    {
      id: 9,
      name: "Handcrafted Metal Statue",
      price: 210,
      image: "/banner3.jpg",
    },
  ];

  const [sortKey, setSortKey] = useState("name"); // 'name' | 'price'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'

  const sortedProducts = useMemo(() => {
    const copy = [...metalProducts];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.price - b.price;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [metalProducts, sortKey, sortOrder]);

  return (
    <div className="pt-16 pb-16 text-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Metal Sculptures</h1>
            <p className="text-gray-600">
              Discover handcrafted metal artworks inspired by Khmer heritage.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              aria-label="Sort by"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
            <button
              type="button"
              onClick={() =>
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
              }
              className="bg-[#8b4513] text-white px-3 py-2 rounded-lg hover:bg-[#6b3410] transition"
              title="Toggle sort order"
            >
              {sortOrder === "asc" ? "Asc ↑" : "Desc ↓"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {sortedProducts.map((product) => (
            <FadeInOnScroll key={product.id}>
              <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group">
                <div className="h-64 w-full overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  <p className="text-gray-600 mt-1 text-lg">${product.price}</p>
                  <NavLink
  to={`/products/metal/${product.id}`}
  className="block mt-4 w-full bg-[#8b4513] text-white text-center py-2 rounded-lg hover:bg-[#6b3410] transition"
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

export default Metal;
