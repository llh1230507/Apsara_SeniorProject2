// src/pages/ProductDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";
import Viewer360 from "../components/Viewer360";
import { useFavorites } from "../context/FavoritesContext";

// helpers
const getMainImage = (p) =>
  p?.imageUrl || Object.values(p?.images || {})[0] || "";

const buildVariantKey = (productId, { color, size, material }) =>
  `${productId}|color=${color}|size=${size}|material=${material}`;

export default function ProductDetail() {
  const { category, id } = useParams();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Customization state
  const [color, setColor] = useState("natural");
  const [size, setSize] = useState("M");
  const [material, setMaterial] = useState("standard");
  const [quantity, setQuantity] = useState(1);

  /* ---------- Fetch product ---------- */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check favorite

  // ✅ IMPORTANT: hooks must run every render, so compute with safe fallbacks
  const sizePrice = product?.sizePrice || { S: 0, M: 20, L: 40 };
  const materialPrice = product?.materialPrice || { standard: 0, premium: 60 };

  const unitPrice = useMemo(() => {
    const base = Number(product?.price) || 0;
    return base + (sizePrice[size] ?? 0) + (materialPrice[material] ?? 0);
  }, [product?.price, size, material, sizePrice, materialPrice]);

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const variantKey = useMemo(() => {
    if (!product?.id) return "";
    return buildVariantKey(product.id, { color, size, material });
  }, [product?.id, color, size, material]);

  const mainImage = useMemo(() => getMainImage(product), [product]);
  const has360 = (product?.images360 || []).length > 0;

  /* ---------- Add to cart ---------- */
  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      imageUrl: mainImage,
      price: unitPrice, // store unit price
      quantity,
      selectedColor: color,
      selectedSize: size,
      selectedMaterial: material,
      variantKey,
      category,
    });
  };

  // ✅ early returns AFTER all hooks
  if (loading) return <p className="p-8">Loading product...</p>;
  if (!product) return <p className="p-8">Product not found</p>;

  return (
    <div className="p-8 grid grid-cols-2 gap-12">
      {/* Image / 360 Viewer */}
      <div>
        {has360 ? (
          <Viewer360 frames={product.images360} alt={product.name} />
        ) : (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-[420px] object-cover rounded-xl shadow"
          />
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 capitalize">{category} sculpture</p>
            <p className="text-xs text-gray-400 mt-1 break-all">
              Variant: {variantKey}
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(product)}
            className="text-3xl transition hover:scale-110"
            aria-label="Add to favorites"
          >
            {isFavorite(product.id) ? "❤️" : "🤍"}
          </button>
        </div>

        <p className="text-xl font-semibold text-red-700">${totalPrice}</p>
        <p className="text-sm text-gray-500">
          Unit: ${unitPrice} • Qty: {quantity}
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
            <option value="M">Medium (+${sizePrice["M"] ?? 0})</option>
            <option value="L">Large (+${sizePrice["L"] ?? 0})</option>
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
            <option value="premium">
              Premium (+${materialPrice["premium"] ?? 0})
            </option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="font-medium block mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1 border rounded text-lg"
              type="button"
            >
              −
            </button>

            <span className="text-lg font-semibold">{quantity}</span>

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-1 border rounded text-lg"
              type="button"
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
