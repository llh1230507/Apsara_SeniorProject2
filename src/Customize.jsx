function Customize() {
  const products = [
    { id: 1, name: "Wood Sculpture" },
    { id: 2, name: "Stone Buddha Statue" },
    { id: 3, name: "Metal Apsara Figurine" },
    { id: 4, name: "Wooden Elephant" },
  ];

  return (
    <div className="max-w-xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Customize a Product</h1>
      <p className="text-gray-600 mb-6">
        Select a product and tell us how you want it customized.
      </p>

      <form className="space-y-5">

        {/* Product Select */}
        <div>
          <label className="block font-semibold mb-1">Choose Product</label>
          <select
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Image */}
        <div>
          <label className="block font-semibold mb-1">Upload Reference Image</label>
          <input
            type="file"
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block font-semibold mb-1">Preferred Size</label>
          <input
            type="text"
            placeholder="Small / Medium / Large"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block font-semibold mb-1">Height</label>
          <input
            type="text"
            placeholder="e.g. 20cm"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1">Customization Details</label>
          <textarea
            rows="4"
            placeholder="Describe your desired customization..."
            className="w-full p-3 border rounded-lg"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-brown-700 hover:bg-brown-800 text-white p-3 rounded-lg font-semibold transition"
        >
          Send Request
        </button>
      </form>
    </div>
  );
}

export default Customize;
