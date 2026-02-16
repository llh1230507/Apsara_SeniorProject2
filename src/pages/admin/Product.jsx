// src/pages/admin/Product.jsx
import { useEffect, useState } from "react";
import ProductForm from "../../components/admin/ProductForm";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

function Product() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const refreshProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      await refreshProducts();
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleAdd = async (product) => {
    await createProduct(product);
    await refreshProducts();
    setShowForm(false);
  };

  const handleUpdate = async (product) => {
    await updateProduct(product.id, product);
    setEditingProduct(null);
    await refreshProducts();
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProduct?.id === id) setEditingProduct(null);
    }
  };

  const handleClickAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClickEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setShowForm(false);
  };

  const getThumb = (p) => p.imageUrl || Object.values(p.images || {})[0] || "";

  if (loading) return <p className="text-gray-500">Loading products...</p>;

  return (
    <div className="space-y-6">
      {/* Top header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
        </div>

        <button
          type="button"
          onClick={handleClickAdd}
          className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800"
        >
          {showForm ? "Add Product" : "Add Product"}
        </button>
      </div>

      {/* Form panel (toggle) */}
      {showForm && (
        <div className="border rounded-xl bg-white p-4">
          <ProductForm
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            editingProduct={editingProduct}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Table */}
      {!showForm && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Base Price</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">360</th>
                <th className="p-3 text-left w-44">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const thumb = getThumb(product);

                const v = product.images360;
                const has360 = Array.isArray(v)
                  ? v.length > 0
                  : v && typeof v === "object"
                    ? Object.values(v).some(
                        (arr) => Array.isArray(arr) && arr.length,
                      )
                    : false;

                return (
                  <tr key={product.id} className="border-t">
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">${product.price ?? 0}</td>
                    <td className="p-3 capitalize">{product.category}</td>
                    <td className="p-3">{product.stock ?? 0}</td>

                    <td className="p-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          N/A
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          has360
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {has360 ? "Enabled" : "No"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleClickEdit(product)}
                          className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    No products yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Product;
