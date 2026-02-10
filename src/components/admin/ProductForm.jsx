// src/components/admin/ProductForm.jsx
import { useEffect, useState } from "react";

export default function ProductForm({ onAdd, onUpdate, editingProduct }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("wood");
  const [description, setDescription] = useState("");

  // Existing color->image map (base64)
  const [images, setImages] = useState({});
  const [imageUrl, setImageUrl] = useState("");

  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // ✅ NEW: 360 frames (URLs, one per line)
  const [images360Text, setImages360Text] = useState("");

  // ✅ NEW: data-driven pricing maps (JSON)
  const [sizePriceJson, setSizePriceJson] = useState(
    JSON.stringify({ S: 0, M: 20, L: 40 }, null, 2)
  );
  const [materialPriceJson, setMaterialPriceJson] = useState(
    JSON.stringify({ standard: 0, premium: 60 }, null, 2)
  );

  const [jsonError, setJsonError] = useState("");

  /* ---------- Load editing product ---------- */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setPrice(editingProduct.price ?? "");
    setCategory(editingProduct.category || "wood");
    setDescription(editingProduct.description || "");

    setImages(editingProduct.images || {});
    setImageUrl(editingProduct.imageUrl || "");

    // NEW fields (safe defaults)
    setImages360Text((editingProduct.images360 || []).join("\n"));

    setSizePriceJson(
      JSON.stringify(
        editingProduct.sizePrice || { S: 0, M: 20, L: 40 },
        null,
        2
      )
    );
    setMaterialPriceJson(
      JSON.stringify(
        editingProduct.materialPrice || { standard: 0, premium: 60 },
        null,
        2
      )
    );

    setJsonError("");
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

    // set first image as main image if none
    if (!imageUrl) setImageUrl(file);

    setColor("");
    setFile(null);
    setPreview("");
  };

  const removeImage = (c) => {
    const updated = { ...images };
    delete updated[c];

    setImages(updated);

    // if main image was removed, reset main to first remaining
    if (imageUrl && images[c] === imageUrl) {
      const nextMain = Object.values(updated)[0] || "";
      setImageUrl(nextMain);
    }
  };

  /* ---------- Submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    setJsonError("");

    // Parse 360 URLs (one per line)
    const images360 = images360Text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse pricing JSON with safe defaults
    let sizePrice = { S: 0, M: 20, L: 40 };
    let materialPrice = { standard: 0, premium: 60 };

    try {
      const parsedSize = JSON.parse(sizePriceJson);
      if (parsedSize && typeof parsedSize === "object") sizePrice = parsedSize;
    } catch {
      setJsonError("Size price JSON is invalid. Please fix it.");
      return;
    }

    try {
      const parsedMaterial = JSON.parse(materialPriceJson);
      if (parsedMaterial && typeof parsedMaterial === "object")
        materialPrice = parsedMaterial;
    } catch {
      setJsonError("Material price JSON is invalid. Please fix it.");
      return;
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      category,
      description,
      imageUrl,
      images,

      // ✅ NEW
      images360,
      sizePrice,
      materialPrice,
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
    setImages360Text("");
    setSizePriceJson(JSON.stringify({ S: 0, M: 20, L: 40 }, null, 2));
    setMaterialPriceJson(JSON.stringify({ standard: 0, premium: 60 }, null, 2));
    setJsonError("");
    setColor("");
    setFile(null);
    setPreview("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow space-y-4"
    >
      <h2 className="font-semibold text-lg">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h2>

      {jsonError && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {jsonError}
        </div>
      )}

      <input
        placeholder="Product Name"
        className="w-full border px-3 py-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <textarea
        placeholder="Description"
        className="w-full border px-3 py-2 rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        placeholder="Base Price"
        className="w-full border px-3 py-2 rounded"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <select
        className="w-full border px-3 py-2 rounded"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="wood">Wood</option>
        <option value="stone">Stone</option>
        <option value="furniture">Furniture</option>
      </select>

      {/* ✅ NEW: PRICING MAPS */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium mb-2">Size Price Map (JSON)</p>
          <textarea
            className="w-full border px-3 py-2 rounded font-mono text-xs h-28"
            value={sizePriceJson}
            onChange={(e) => setSizePriceJson(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: {"{ \"S\":0, \"M\":20, \"L\":40 }"}
          </p>
        </div>

        <div>
          <p className="font-medium mb-2">Material Price Map (JSON)</p>
          <textarea
            className="w-full border px-3 py-2 rounded font-mono text-xs h-28"
            value={materialPriceJson}
            onChange={(e) => setMaterialPriceJson(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: {"{ \"standard\":0, \"premium\":60 }"}
          </p>
        </div>
      </div>

      {/* ✅ NEW: 360 FRAMES URLs */}
      <div>
        <p className="font-medium mb-2">360 Frames URLs (one per line)</p>
        <textarea
          className="w-full border px-3 py-2 rounded font-mono text-xs h-28"
          placeholder={`https://.../frame01.jpg\nhttps://.../frame02.jpg\n...`}
          value={images360Text}
          onChange={(e) => setImages360Text(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Tip: start with 24 or 36 frames for one demo product.
        </p>
      </div>

      {/* IMAGE UPLOAD (color images) */}
      <div>
        <p className="font-medium mb-2">Color Images (base64 demo)</p>

        <div className="flex gap-2 items-center">
          <input
            placeholder="Color key (e.g. natural, dark, light)"
            className="border px-3 py-2 rounded w-1/3"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />

          <input type="file" accept="image/*" onChange={handleFileChange} />

          <button
            type="button"
            onClick={addImage}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        {/* PREVIEW */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-24 h-24 object-cover rounded border mt-3"
          />
        )}

        {/* SAVED IMAGES */}
        <div className="flex gap-3 flex-wrap mt-3">
          {Object.entries(images).map(([c, img]) => (
            <div key={c} className="text-center">
              <img src={img} alt={c} className="w-16 h-16 object-cover rounded" />
              <div className="flex items-center justify-center gap-2 mt-1">
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
                className={`text-[11px] mt-1 px-2 py-1 rounded border ${
                  imageUrl === img ? "bg-black text-white" : "bg-white"
                }`}
              >
                {imageUrl === img ? "Main" : "Set main"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="bg-red-700 text-white px-4 py-2 rounded">
        {editingProduct ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}
