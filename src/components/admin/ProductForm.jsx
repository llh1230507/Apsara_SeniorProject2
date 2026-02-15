// src/components/admin/ProductForm.jsx
import { useEffect, useMemo, useState } from "react";

const DEFAULT_MATERIAL_PRICE = { standard: 0, premium: 60 };

export default function ProductForm({
  onAdd,
  onUpdate,
  editingProduct,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("wood");
  const [description, setDescription] = useState("");

  // ✅ one-size product dimensions
  const [size, setSize] = useState({ width: "", length: "", height: "" });

  // color -> image map (base64 demo)
  const [images, setImages] = useState({});
  const [imageUrl, setImageUrl] = useState("");

  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // ✅ material price
  const [materialPrice, setMaterialPrice] = useState(DEFAULT_MATERIAL_PRICE);

  // ✅ 360 frames UI (rows)
  const [images360, setImages360] = useState([""]);

  const [error, setError] = useState("");
  const [stock, setStock] = useState("");

  /* ---------- Load editing product ---------- */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setPrice(editingProduct.price ?? "");
    setCategory(editingProduct.category || "wood");
    setDescription(editingProduct.description || "");

    setImages(editingProduct.images || {});
    setImageUrl(editingProduct.imageUrl || "");
    setStock(editingProduct.stock ?? "");

    setSize({
      width: editingProduct.size?.width ?? "",
      length: editingProduct.size?.length ?? "",
      height: editingProduct.size?.height ?? "",
    });

    setMaterialPrice(editingProduct.materialPrice || DEFAULT_MATERIAL_PRICE);

    const frames = editingProduct.images360 || [];
    setImages360(frames.length ? frames : [""]);

    setError("");
    setPreview("");
    setFile(null);
    setColor("");
  }, [editingProduct]);

  /* ---------- File → base64 ---------- */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFile(reader.result);
    };
    reader.readAsDataURL(selected);
  };

  /* ---------- Add color image ---------- */
  const addImage = () => {
    if (!color || !file) return;

    const key = color.trim().toLowerCase();
    const updated = { ...images, [key]: file };
    setImages(updated);

    // set first image as main if none
    if (!imageUrl) setImageUrl(file);

    setColor("");
    setFile(null);
    setPreview("");
  };

  const removeImage = (c) => {
    const updated = { ...images };
    const removed = updated[c];
    delete updated[c];
    setImages(updated);

    if (imageUrl && removed === imageUrl) {
      setImageUrl(Object.values(updated)[0] || "");
    }
  };

  /* ---------- 360 frames helpers ---------- */
  const updateFrame = (idx, value) => {
    setImages360((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const addFrameRow = () => setImages360((prev) => [...prev, ""]);
  const removeFrameRow = (idx) =>
    setImages360((prev) => prev.filter((_, i) => i !== idx));

  const cleanedFrames = useMemo(
    () => images360.map((s) => s.trim()).filter(Boolean),
    [images360],
  );

  /* ---------- Submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (price === "" || Number(price) < 0)
      return setError("Base price is invalid.");

    // ✅ one-size dims are optional, but if you want to require them, uncomment this:
    // const w = Number(size.width || 0);
    // const l = Number(size.length || 0);
    // const h = Number(size.height || 0);
    // if (w <= 0 || l <= 0 || h <= 0) return setError("Please fill Width/Length/Height > 0.");

    const productData = {
      name: name.trim(),
      price: Number(price),
      category,
      description,
      stock: Number(stock || 0),

      // images
      imageUrl,
      images,

      // ✅ one-size dims
      size: {
        width: Number(size.width || 0),
        length: Number(size.length || 0),
        height: Number(size.height || 0),
      },

      // ✅ optional 360
      images360: cleanedFrames,

      // ✅ material pricing
      materialPrice: {
        standard: Number(materialPrice.standard || 0),
        premium: Number(materialPrice.premium || 0),
      },
    };

    if (editingProduct) {
      onUpdate({ ...editingProduct, ...productData });
    } else {
      onAdd(productData);
    }

    // Reset
    setName("");
    setPrice("");
    setCategory("wood");
    setDescription("");
    setImages({});
    setImageUrl("");
    setMaterialPrice(DEFAULT_MATERIAL_PRICE);
    setImages360([""]);
    setError("");
    setColor("");
    setFile(null);
    setPreview("");
    setSize({ width: "", length: "", height: "" });
    setStock("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b bg-gray-50 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {editingProduct ? "Edit Product" : "Add Product"}
          </h2>
         

          {editingProduct?.name ? (
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white border">
              <span className="text-gray-500">Editing:</span>
              <span className="font-semibold">{editingProduct.name}</span>
            </div>
          ) : null}
        </div>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"
          >
            Close
          </button>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Basic info */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Basic Information</h3>
            <span className="text-xs text-gray-500">Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="wood">Wood</option>
                <option value="stone">Stone</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Base Price
              </label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                min="0"
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Enter stock"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="w-full border px-3 py-2 rounded-lg min-h-[96px] focus:outline-none focus:ring-2 focus:ring-red-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
        </section>

        {/* Size */}
        <section className="border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Product Size (cm)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-gray-600">Width</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={size.width}
                onChange={(e) =>
                  setSize((p) => ({ ...p, width: e.target.value }))
                }
                placeholder="cm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-600">Length</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={size.length}
                onChange={(e) =>
                  setSize((p) => ({ ...p, length: e.target.value }))
                }
                placeholder="cm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-600">Height</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={size.height}
                onChange={(e) =>
                  setSize((p) => ({ ...p, height: e.target.value }))
                }
                placeholder="cm"
              />
            </div>
          </div>
        </section>

        {/* Material pricing */}
        <section className="border rounded-xl p-4">
          <h3 className="font-semibold mb-1">Material Pricing</h3>
          

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-gray-600">Standard add-on</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={materialPrice.standard}
                onChange={(e) =>
                  setMaterialPrice((p) => ({
                    ...p,
                    standard: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-600">Premium add-on</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={materialPrice.premium}
                onChange={(e) =>
                  setMaterialPrice((p) => ({
                    ...p,
                    premium: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* 360 frames */}
        <section className="border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">360 Frames (URLs)</h3>
            <button
              type="button"
              onClick={addFrameRow}
              className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              + Add frame
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {images360.map((v, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder={`Frame ${idx + 1} URL`}
                  value={v}
                  onChange={(e) => updateFrame(idx, e.target.value)}
                />
                {images360.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFrameRow(idx)}
                    className="text-sm px-3 py-2 border rounded-lg text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          
        </section>

        {/* Color images */}
        <section className="border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Color Images</h3>

          <div className="flex gap-2 items-center flex-wrap">
            <input
              placeholder="Color key"
              className="border px-3 py-2 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <input type="file" accept="image/*" onChange={handleFileChange} />

            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            >
              Add
            </button>
          </div>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="w-24 h-24 object-cover rounded-lg border mt-3"
            />
          )}

          <div className="flex gap-3 flex-wrap mt-4">
            {Object.entries(images).map(([c, img]) => (
              <div key={c} className="text-center">
                <img
                  src={img}
                  alt={c}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-xs capitalize">{c}</p>
                  <button
                    type="button"
                    onClick={() => removeImage(c)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    remove
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className={`text-[11px] mt-2 px-2 py-1 rounded border ${
                    imageUrl === img ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  {imageUrl === img ? "Main" : "Set main"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {editingProduct
            ? "Update existing product details."
            : "Create a new product."}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="bg-red-700 text-white px-5 py-2.5 rounded-lg hover:bg-red-800 text-sm font-medium"
          >
            {editingProduct ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
