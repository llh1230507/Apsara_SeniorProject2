import { useState } from "react";
import { useParams } from "react-router-dom";

function ProductDetail() {
  const { category, id } = useParams();

  const product = {
    id,
    name: "Horse Sculpture",
    category,
    price: 120,
    description: "Handcrafted traditional Apsara sculpture.",
    images: {
      black: "/DarkHorse.png",
      brown: "/BrownHorse.png",
      red: "/RedHorse.png",
    },
  };

  const [selectedColor, setSelectedColor] = useState("black");

  return (
    <div className="max-w-5xl mx-auto p-8 grid md:grid-cols-2 gap-10">
      <div>
        <img
          src={product.images[selectedColor]}
          alt={product.name}
          className="w-full h-[420px] object-cover rounded-xl shadow"
        />
      </div>

      <div>
        <p className="text-sm text-gray-500 capitalize mb-1">
          {product.category} sculpture
        </p>

        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

        <p className="text-xl text-red-700 font-semibold mb-4">
          ${product.price}
        </p>

        <p className="text-gray-600 mb-6">{product.description}</p>

        <div className="mb-6">
          <p className="font-medium mb-2">Choose Color</p>

          <div className="flex gap-4">
            {Object.keys(product.images).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition ${
                  selectedColor === color
                    ? "border-black scale-110"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <button className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;
