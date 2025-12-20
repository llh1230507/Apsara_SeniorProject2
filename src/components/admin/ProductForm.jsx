import { useEffect, useState } from "react";

export default function ProductForm({ onAdd, onUpdate, editingProduct }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("wood");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price);
      setCategory(editingProduct.category);
      setImage(editingProduct.image);
    }
  }, [editingProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const productData = { name, price, category, image };

    if (editingProduct) {
      onUpdate({ ...editingProduct, ...productData });
    } else {
      onAdd(productData);
    }

    setName("");
    setPrice("");
    setCategory("wood");
    setImage("");
  };

  return (
    <form className="bg-white p-6 rounded shadow space-y-4" onSubmit={handleSubmit}>
      <h2 className="font-semibold">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h2>

      <input
        placeholder="Product Name"
        className="w-full border px-3 py-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Price"
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
        <option value="metal">Metal</option>
      </select>

      <input
        placeholder="Image URL"
        className="w-full border px-3 py-2 rounded"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />

      {image && (
        <img
          src={image}
          alt="Preview"
          className="w-24 h-24 object-cover rounded border"
        />
      )}

      <button className="bg-red-700 text-white px-4 py-2 rounded">
        {editingProduct ? "Update" : "Add"}
      </button>
    </form>
  );
}
