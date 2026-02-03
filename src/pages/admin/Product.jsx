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

  // 🔥 LOAD PRODUCTS FROM FIRESTORE
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // ➕ ADD
  const handleAdd = async (product) => {
    await createProduct(product);
    const updated = await getAllProducts();
    setProducts(updated);
  };

  // ✏️ UPDATE
  const handleUpdate = async (product) => {
    await updateProduct(product.id, product);
    setEditingProduct(null);
    const updated = await getAllProducts();
    setProducts(updated);
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
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
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">${product.price ?? product.basePrice ?? 0}</td>
                <td className="p-3 capitalize">{product.category}</td>
                <td className="p-3">
                  <img
  src={Object.values(product.images || {})[0]}
  alt={product.name}
  className="w-12 h-12 rounded object-cover"
/>

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
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
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