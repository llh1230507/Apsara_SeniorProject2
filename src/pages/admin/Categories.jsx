// src/pages/admin/Categories.jsx
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import useCategories from "../../hooks/useCategories";
import {
  FaPlus,
  FaTrash,
  FaPen,
  FaCheck,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

// Default categories to seed when none exist
const DEFAULTS = [
  { key: "wood", label: "Wood Sculptures", order: 0 },
  { key: "stone", label: "Stone Art", order: 1 },
  { key: "furniture", label: "Furniture", order: 2 },
];

export default function Categories() {
  const { categories, loading } = useCategories();
  const [seeded, setSeeded] = useState(false);

  // Form state
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editKey, setEditKey] = useState("");
  const [editLabel, setEditLabel] = useState("");

  // Seed defaults if collection is empty (one-time)
  useEffect(() => {
    if (loading || seeded) return;
    if (categories.length === 0) {
      (async () => {
        const batch = writeBatch(db);
        for (const cat of DEFAULTS) {
          const ref = doc(collection(db, "categories"));
          batch.set(ref, cat);
        }
        await batch.commit();
        setSeeded(true);
      })();
    } else {
      setSeeded(true);
    }
  }, [loading, categories.length, seeded]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Add new category
  const handleAdd = async (e) => {
    e.preventDefault();
    clearMessages();

    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    const label = newLabel.trim();

    if (!key || !label) return setError("Both key and label are required.");
    if (categories.some((c) => c.key === key))
      return setError(`Category key "${key}" already exists.`);

    try {
      await addDoc(collection(db, "categories"), {
        key,
        label,
        order: categories.length,
      });
      setNewKey("");
      setNewLabel("");
      setSuccess(`Category "${label}" added.`);
    } catch (err) {
      setError("Failed to add category: " + err.message);
    }
  };

  // Delete category
  const handleDelete = async (cat) => {
    clearMessages();
    if (
      !window.confirm(
        `Delete "${cat.label}"? Products with this category won't be affected.`,
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "categories", cat.id));
      setSuccess(`"${cat.label}" deleted.`);
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  // Start editing
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditKey(cat.key);
    setEditLabel(cat.label);
    clearMessages();
  };

  // Save edit
  const saveEdit = async () => {
    clearMessages();
    const key = editKey.trim().toLowerCase().replace(/\s+/g, "_");
    const label = editLabel.trim();
    if (!key || !label) return setError("Both key and label are required.");

    const duplicate = categories.find(
      (c) => c.key === key && c.id !== editingId,
    );
    if (duplicate)
      return setError(`Key "${key}" is already used by "${duplicate.label}".`);

    try {
      await updateDoc(doc(db, "categories", editingId), { key, label });
      setEditingId(null);
      setSuccess(`Category updated.`);
    } catch (err) {
      setError("Update failed: " + err.message);
    }
  };

  // Reorder
  const moveCategory = async (index, direction) => {
    clearMessages();
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const batch = writeBatch(db);
    batch.update(doc(db, "categories", categories[index].id), {
      order: swapIdx,
    });
    batch.update(doc(db, "categories", categories[swapIdx].id), {
      order: index,
    });
    await batch.commit();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-xl shadow border p-5 mb-6"
      >
        <h2 className="text-lg font-semibold mb-3">Add New Category</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Key</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Display Label
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-800 transition flex items-center justify-center gap-2"
            >
              <FaPlus className="text-xs" /> Add Category
            </button>
          </div>
        </div>
      </form>

      {/* Categories list */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left p-3 w-12">#</th>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Label</th>
              <th className="text-right p-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr
                key={cat.id}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="p-3 text-gray-400">{i + 1}</td>
                <td className="p-3">
                  {editingId === cat.id ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value)}
                    />
                  ) : (
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {cat.key}
                    </code>
                  )}
                </td>
                <td className="p-3">
                  {editingId === cat.id ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                    />
                  ) : (
                    cat.label
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === cat.id ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="p-1.5 rounded hover:bg-green-100 text-green-600"
                          title="Save"
                        >
                          <FaCheck />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => moveCategory(i, -1)}
                          disabled={i === 0}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                          title="Move up"
                        >
                          <FaArrowUp className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(i, 1)}
                          disabled={i === categories.length - 1}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                          title="Move down"
                        >
                          <FaArrowDown className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
                          title="Edit"
                        >
                          <FaPen className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No categories yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
