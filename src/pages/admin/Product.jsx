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

  // LOAD PRODUCTS FROM FIRESTORE
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // ADD
  const handleAdd = async (product) => {
    await createProduct(product);
    const updated = await getAllProducts();
    setProducts(updated);
  };

  // UPDATE
  const handleUpdate = async (product) => {
    await updateProduct(product.id, product);
    setEditingProduct(null);
    const updated = await getAllProducts();
    setProducts(updated);
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProduct?.id === id) setEditingProduct(null);
    }
  };

  const getThumb = (p) => {
    // prefer imageUrl if present, else first in images, else empty
    return (
      p.imageUrl ||
      Object.values(p.images || {})[0] ||
      ""
    );
  };

  if (loading) {
    return <p className="text-gray-500">Loading products...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <ProductForm
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        editingProduct={editingProduct}
      />

      <div className="bg-white rounded shadow mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Base Price</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">360</th>
              <th className="p-3 text-left w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const thumb = getThumb(product);
              const has360 = (product.images360 || []).length > 0;

              return (
                <tr key={product.id} className="border-t">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">${product.price ?? 0}</td>
                  <td className="p-3 capitalize">{product.category}</td>

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
                        has360 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {has360 ? "Enabled" : "No"}
                    </span>
                  </td>

                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  No products yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Product;
