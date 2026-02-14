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
const money = (n) => Number(n || 0).toFixed(2);

const buildVariantKey = (productId, { color, material }) =>
  `${productId}|color=${color}|material=${material}`;

export default function ProductDetail() {
  const { category, id } = useParams();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Customization state
  const [color, setColor] = useState("natural");
  const [material, setMaterial] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("size"); // "size" | "description"

  /* ---------- Fetch product ---------- */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        else setProduct(null);
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ safe fallback
  const materialPrice = product?.materialPrice || { standard: 0, premium: 60 };
  const materialOptions = [
    {
      key: "standard",
      title: "Standard Product",
      subtitle: "Default",
      add: Number(materialPrice.standard ?? 0),
    },
    {
      key: "premium",
      title: "Premium Material",
      subtitle: "Upgraded",
      add: Number(materialPrice.premium ?? 0),
    },
  ];

  // ✅ One-size dimensions from admin: product.size = { width, length, height }
  const dims = useMemo(() => {
    const s = product?.size;
    if (!s) return null;

    const width = Number(s.width || 0);
    const length = Number(s.length || 0);
    const height = Number(s.height || 0);

    // if admin left it blank, don't show it
    if (!width && !length && !height) return null;

    return { width, length, height };
  }, [product]);

  const basePrice = useMemo(
    () => Number(product?.price) || 0,
    [product?.price],
  );

  const materialAddon = useMemo(
    () => Number(materialPrice?.[material] ?? 0),
    [materialPrice, material],
  );

  const unitPrice = useMemo(
    () => basePrice + materialAddon,
    [basePrice, materialAddon],
  );

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const variantKey = useMemo(() => {
    if (!product?.id) return "";
    return buildVariantKey(product.id, { color, material });
  }, [product?.id, color, material]);

  const has360 = (product?.images360 || []).length > 0;
  // ✅ Colors from admin (dynamic)
  const availableColors = useMemo(() => {
    return Object.keys(product?.images || {});
  }, [product]);
  useEffect(() => {
    if (!availableColors.length) return;

    if (!availableColors.includes(color)) {
      setColor(availableColors[0]);
    }
  }, [availableColors]);

  // ✅ image based on selected color if available
  const mainImage = useMemo(() => {
    const fallback = getMainImage(product);
    const map = product?.images || {};
    const chosen = map?.[String(color).toLowerCase()];
    return chosen || fallback;
  }, [product, color]);

  /* ---------- Add to cart ---------- */
  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      imageUrl: mainImage,

      price: unitPrice,
      quantity,

      selectedColor: color,
      selectedMaterial: material,

      // ✅ store one-size dims on the cart item (optional but useful)
      sizeDims: dims, // { width, length, height } or null

      variantKey,
      category,
    });
  };

  // ✅ early returns AFTER hooks
  if (loading) return <p className="p-8">Loading product...</p>;
  if (!product) return <p className="p-8">Product not found</p>;

  return (
    <div className="p-8 space-y-16">
      {/* ===== TOP SECTION (2 COLUMN GRID) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image / 360 Viewer */}
        <div className="space-y-4">
          {has360 ? (
            <Viewer360 frames={product.images360} alt={product.name} />
          ) : (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-[420px] object-cover rounded-xl shadow"
            />
          )}

          {/* Selected option chips */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              Color: <b className="capitalize">{color}</b>
            </span>

            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              Material: <b className="capitalize">{material}</b>
            </span>

            {dims ? (
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
                Size:{" "}
                <b>
                  {dims.width}×{dims.length}×{dims.height} cm
                </b>
              </span>
            ) : null}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <button
                onClick={() => toggleFavorite(product)}
                className="text-3xl transition hover:scale-110 ml-40"
                aria-label="Add to favorites"
                type="button"
              >
                {isFavorite(product.id) ? "❤️" : "🤍"}
              </button>
            </div>

            <p className="text-gray-600 font-semibold capitalize">
              Category: {category}
            </p>
          </div>

          {/* Price highlight */}
          <p className="text-3xl font-semibold text-red-700">
            ${money(totalPrice)}
          </p>

          {/* Color */}
          <div>
            <label className="font-medium block mb-3">Color</label>

            {availableColors.length > 0 ? (
              <div className="flex gap-4 items-center">
                {availableColors.map((c) => {
                  const isSelected = color === c;

                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full border-2 transition 
              ${isSelected ? "border-black scale-110" : "border-gray-300"}
            `}
                      style={{
                        backgroundColor: c,
                      }}
                      title={c}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No color variations available
              </p>
            )}
          </div>

          {/* Material (clickable options) */}
<div>
  <label className="font-medium block mb-2">Material</label>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
    {materialOptions.map((opt) => {
      const selected = material === opt.key;

      return (
        <button
          key={opt.key}
          type="button"
          onClick={() => setMaterial(opt.key)}
          className={`rounded-lg border p-3 text-left transition text-sm
            ${
              selected
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-400"
            }
          `}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{opt.title}</p>
              <p className="text-xs text-gray-500">{opt.subtitle}</p>
            </div>

            <div
              className={`px-2 py-1 rounded-full text-xs font-semibold
                ${
                  selected
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }
              `}
            >
              {opt.add >= 0
                ? `+$${money(opt.add)}`
                : `-$${money(Math.abs(opt.add))}`}
            </div>
          </div>
        </button>
      );
    })}
  </div>
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
            type="button"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* ===== FULL WIDTH TABS SECTION ===== */}
      <div className="w-full border rounded-xl bg-white overflow-hidden">
        <div className="flex border-b">

          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === "description"
                ? "border-b-2 border-red-700 text-red-700"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("size")}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === "size"
                ? "border-b-2 border-red-700 text-red-700"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Product Size
          </button>

          
        </div>

        <div className="p-10 text-gray-700 text-lg">
          {activeTab === "size" ? (
            dims ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 border-b">Dimension</th>
                      <th className="px-6 py-3 border-b">Measurement (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-6 py-4 font-medium">Width</td>
                      <td className="px-6 py-4">{dims.width}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-6 py-4 font-medium">Length</td>
                      <td className="px-6 py-4">{dims.length}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium">Height</td>
                      <td className="px-6 py-4">{dims.height}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No size information provided.</p>
            )
          ) : (
            <p className="leading-relaxed">
              {product?.description || "No description provided."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
