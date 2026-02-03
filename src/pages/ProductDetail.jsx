import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { category, id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);


  // Customization state
  const [color, setColor] = useState("natural");
  const [size, setSize] = useState("M");
  const [material, setMaterial] = useState("standard");
  const [quantity, setQuantity] = useState(1);


  /* ---------- Fetch product ---------- */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check if product is already favorited
useEffect(() => {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  setIsFavorite(favorites.some((item) => item.id === id));
}, [id]);


  if (loading) return <p className="p-8">Loading product...</p>;
  if (!product) return <p className="p-8">Product not found</p>;

  /* ---------- Price calculation ---------- */
  const sizePrice = { S: 0, M: 20, L: 40 };
  const materialPrice = { standard: 0, premium: 60 };

  const finalPrice =
    Number(product.price) +
    sizePrice[size] +
    materialPrice[material];

 


  /* ---------- Add to cart ---------- */
  const handleAddToCart = () => {
  addToCart({
  id: product.id,
  name: product.name,
  imageUrl: Object.values(product.images || {})[0],
  price: finalPrice,
  quantity,              // 🔥 REQUIRED
  selectedColor: color,
  selectedSize: size,
  selectedMaterial: material,
  category,
});

};


  const toggleFavorite = () => {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (isFavorite) {
    const updated = favorites.filter((item) => item.id !== product.id);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setIsFavorite(false);
  } else {
    localStorage.setItem(
      "favorites",
      JSON.stringify([...favorites, product])
    );
    setIsFavorite(true);
  }
};


  return (
    <div className="p-8 grid grid-cols-2 gap-12">
      {/* Image */}
      <div>
        <img
  src={Object.values(product.images || {})[0]}
  alt={product.name}
  className="w-full h-[420px] object-cover rounded-xl shadow"
/>

      </div>

      {/* Details */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold">{product.name}</h1>
    <p className="text-gray-600 capitalize">{category} sculpture</p>
  </div>

  <button
    onClick={toggleFavorite}
    className="text-3xl transition hover:scale-110"
    aria-label="Add to favorites"
  >
    {isFavorite ? "❤️" : "🤍"}
  </button>
</div>


        <p className="text-xl font-semibold text-red-700">
  ${finalPrice * quantity}
</p>


        {/* Color */}
        <div>
          <label className="font-medium block mb-2">Color</label>
          <select
            className="border px-3 py-2 rounded w-48"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            <option value="natural">Natural</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="font-medium block mb-2">Size</label>
          <select
            className="border px-3 py-2 rounded w-48"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option value="S">Small</option>
            <option value="M">Medium (+$20)</option>
            <option value="L">Large (+$40)</option>
          </select>
        </div>

        {/* Material */}
        <div>
          <label className="font-medium block mb-2">Material</label>
          <select
            className="border px-3 py-2 rounded w-48"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium (+$60)</option>
          </select>
        </div>

         {/* Quantity */}
<div>
  <label className="font-medium block mb-2">Quantity</label>
  <div className="flex items-center gap-4">
    <button
      onClick={() => setQuantity(q => Math.max(1, q - 1))}
      className="px-3 py-1 border rounded text-lg"
    >
      −
    </button>

    <span className="text-lg font-semibold">{quantity}</span>

    <button
      onClick={() => setQuantity(q => q + 1)}
      className="px-3 py-1 border rounded text-lg"
    >
      +
    </button>
  </div>
</div>

        {/* Actions */}
        <button
          onClick={handleAddToCart}
          className="bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}