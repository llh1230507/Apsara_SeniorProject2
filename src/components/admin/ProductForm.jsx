import { useEffect, useState } from "react";

export default function ProductForm({ onAdd, onUpdate, editingProduct }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("wood");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState({});
  const [imageUrl, setImageUrl] = useState("");

  const [color, setColor] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  /* ---------- Load editing product ---------- */
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || "");
      setPrice(editingProduct.price || "");
      setCategory(editingProduct.category || "wood");
      setDescription(editingProduct.description || "");
      setImages(editingProduct.images || {});
      setImageUrl(editingProduct.imageUrl || "");
    }
  }, [editingProduct]);

  /* ---------- File → base64 ---------- */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
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

    const updated = { ...images, [color]: file };
    setImages(updated);

    // set first image as main image
    if (!imageUrl) {
      setImageUrl(file);
    }

    setColor("");
    setFile(null);
    setPreview("");
  };

  /* ---------- Submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    const productData = {
      name,
      price: Number(price),
      category,
      description,
      imageUrl,
      images,
    };

    editingProduct
      ? onUpdate({ ...editingProduct, ...productData })
      : onAdd(productData);

    // Reset
    setName("");
    setPrice("");
    setCategory("wood");
    setDescription("");
    setImages({});
    setImageUrl("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h2>

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

      {/* IMAGE UPLOAD */}
      <div className="flex gap-2 items-center">
        <input
          placeholder="Color (e.g. brown)"
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
        <img src={preview} className="w-24 h-24 object-cover rounded border" />
      )}

      {/* SAVED IMAGES */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(images).map(([c, img]) => (
          <div key={c} className="text-center">
            <img src={img} className="w-16 h-16 object-cover rounded" />
            <p className="text-xs capitalize">{c}</p>
          </div>
        ))}
      </div>

      <button className="bg-red-700 text-white px-4 py-2 rounded">
        {editingProduct ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}
