// src/components/admin/ProductForm.jsx
import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

const DEFAULT_MATERIAL_PRICE = { standard: "0", premium: "60" };

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

  // one-size product dimensions
  const [size, setSize] = useState({ width: "", length: "", height: "" });

  // color -> image map (Storage URLs)
  const [images, setImages] = useState({});
  const [imageUrl, setImageUrl] = useState("");

  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // material price
  const [materialPrice, setMaterialPrice] = useState(DEFAULT_MATERIAL_PRICE);

  // 360 frames — array of already-uploaded Storage URLs
  const [images360, setImages360] = useState([]);
  // pending files selected but not yet uploaded
  const [frames360Files, setFrames360Files] = useState([]);
  const [frames360Previews, setFrames360Previews] = useState([]);
  const [uploading360, setUploading360] = useState(false);
  const [uploadProgress360, setUploadProgress360] = useState({ done: 0, total: 0 });

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

    setMaterialPrice({
      standard: String(editingProduct.materialPrice?.standard ?? 0),
      premium: String(editingProduct.materialPrice?.premium ?? 60),
    });

    const frames = editingProduct.images360 || [];
    setImages360(Array.isArray(frames) ? frames : []);
    setFrames360Files([]);
    setFrames360Previews([]);

    setError("");
    setPreview("");
    setFile(null);
    setColor("");
  }, [editingProduct]);

  /* ---------- File → preview (raw File stored, not base64) ---------- */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setPreview(URL.createObjectURL(selected));
    setFile(selected);
  };

  /* ---------- Add color image (uploads to Firebase Storage) ---------- */
  const addImage = async () => {
    if (!color || !file) return;

    const key = color.trim().toLowerCase();
    setUploading(true);
    try {
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, `products/uploads/${uniqueId}/${key}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const updated = { ...images, [key]: url };
      setImages(updated);

      if (!imageUrl) setImageUrl(url);
    } catch (err) {
      setError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }

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

  /* ---------- 360 frames — multi-file upload ---------- */
  const handle360FilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFrames360Files(files);
    setFrames360Previews(files.map((f) => URL.createObjectURL(f)));
  };

  const upload360Frames = async () => {
    if (!frames360Files.length) return;
    setUploading360(true);
    setUploadProgress360({ done: 0, total: frames360Files.length });
    const urls = [];
    try {
      for (let i = 0; i < frames360Files.length; i++) {
        const f = frames360Files[i];
        const ext = f.name.split(".").pop() || "jpg";
        const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const storageRef = ref(storage, `products/360/${uniqueId}_${i}.${ext}`);
        await uploadBytes(storageRef, f);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
        setUploadProgress360({ done: i + 1, total: frames360Files.length });
      }
      setImages360((prev) => [...prev, ...urls]);
      setFrames360Files([]);
      setFrames360Previews([]);
    } catch (err) {
      setError("360 upload failed: " + err.message);
    } finally {
      setUploading360(false);
    }
  };

  const removeFrame360 = (idx) => {
    setImages360((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------- Submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (price === "" || Number(price) <= 0)
      return setError("Base price must be greater than 0.");
    if (stock !== "" && Number(stock) < 0)
      return setError("Stock cannot be negative.");
    if (
      (size.width !== "" && Number(size.width) <= 0) ||
      (size.length !== "" && Number(size.length) <= 0) ||
      (size.height !== "" && Number(size.height) <= 0)
    )
      return setError("Product dimensions must be greater than 0.");
    if (Number(materialPrice.standard) < 0 || Number(materialPrice.premium) < 0)
      return setError("Material prices cannot be negative.");

    const productData = {
      name: name.trim(),
      price: Number(price),
      category,
      description,
      stock: Number(stock || 0),

      imageUrl,
      images,

      size: {
        width: Number(size.width || 0),
        length: Number(size.length || 0),
        height: Number(size.height || 0),
      },

      images360,

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
    setImages360([]);
    setFrames360Files([]);
    setFrames360Previews([]);
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
                min="0.01"
                step="0.01"
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
                min="0.1"
                step="0.1"
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
                min="0.1"
                step="0.1"
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
                min="0.1"
                step="0.1"
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
                min="0"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={materialPrice.standard}
                onChange={(e) =>
                  setMaterialPrice((p) => ({
                    ...p,
                    standard: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-600">Premium add-on</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={materialPrice.premium}
                onChange={(e) =>
                  setMaterialPrice((p) => ({
                    ...p,
                    premium: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* 360 frames — multi-file upload */}
        <section className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">360° Frames</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {images360.length} frame{images360.length !== 1 ? "s" : ""}{" "}
                uploaded 
              </p>
            </div>
            {images360.length > 0 && (
              <button
                type="button"
                onClick={() => setImages360([])}
                className="text-xs text-red-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* File picker */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading360}
              onChange={handle360FilesSelect}
              className="text-sm"
            />
            {frames360Files.length > 0 && (
              <button
                type="button"
                onClick={upload360Frames}
                disabled={uploading360}
                className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800 disabled:opacity-50"
              >
                {uploading360
                  ? `Uploading ${uploadProgress360.done} / ${uploadProgress360.total}...`
                  : `Upload ${frames360Files.length} frame${frames360Files.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          {/* Pending previews (selected but not yet uploaded) */}
          {frames360Previews.length > 0 && !uploading360 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">
                Preview — press Upload to save:
              </p>
              <div className="flex flex-wrap gap-2">
                {frames360Previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`pending ${i + 1}`}
                      className="w-14 h-14 object-cover rounded border border-dashed border-gray-400"
                    />
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white rounded-b">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded frames */}
          {images360.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {images360.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`frame ${i + 1}`}
                      className="w-14 h-14 object-cover rounded border"
                    />
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white rounded-b">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFrame360(i)}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex bg-red-600 text-white rounded-full w-4 h-4 items-center justify-center text-[10px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              disabled={uploading}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Add"}
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
