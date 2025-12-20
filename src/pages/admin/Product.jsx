import { useState } from "react";
import ProductForm from "../../components/admin/ProductForm";

function Product() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Wood Statue",
      price: 45,
      category: "wood",
      image: "/product1.jpg",
    },
  ]);

  const [editingProduct, setEditingProduct] = useState(null);

  const handleAdd = (product) => {
    setProducts([...products, { ...product, id: Date.now() }]);
  };

  const handleUpdate = (updatedProduct) => {
    setProducts(
      products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

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
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3 w-40">Actions</th>
              <th className="p-3">Image</th>
              <th className="p-3">Category</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">${product.price}</td>
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
                <td className="p-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                </td>

                <td className="p-3 capitalize">{product.category}</td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No products found
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
