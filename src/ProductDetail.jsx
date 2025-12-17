import { useParams } from "react-router-dom"

const mockProducts = {
  1: {
    id: 1,
    name: "Brushed Steel Panel",
    price: "$120",
    description:
      "High-quality brushed steel panel suitable for modern interior and exterior applications.",
    image: "https://images.unsplash.com/photo-1581091870627-3c7c1c1c1c1c",
  },
  2: {
    id: 2,
    name: "Industrial Iron Sheet",
    price: "$95",
    description:
      "Durable iron sheet with industrial finish, perfect for heavy-duty use.",
    image: "https://images.unsplash.com/photo-1581090700227-1c1c1c1c1c1c",
  },
}

function ProductDetail() {
  const { id } = useParams()
  const product = mockProducts[id]

  if (!product) {
    return (
      <div className="pt-32 text-center">
        <h2 className="text-2xl font-semibold">Product not found</h2>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-start">

        {/* Image */}
        <div className="bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[420px] object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <p className="text-2xl text-red-600 font-semibold mb-6">
            {product.price}
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-8">
            <label className="font-medium">Quantity</label>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="w-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition">
              Add to Cart
            </button>

            <button className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:border-red-600 hover:text-red-600 transition">
              Back to Products
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
