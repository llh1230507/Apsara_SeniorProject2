function Customize() {
  const products = [
    { id: 1, name: "Wood Sculpture" },
    { id: 2, name: "Stone Buddha Statue" },
    { id: 3, name: "Metal Apsara Figurine" },
    { id: 4, name: "Wooden Elephant" },
  ];

  return (
    <div className="max-w-xl mx-auto p-4 text-gray-800">
      <h1 className="text-2xl font-bold mb-1">Customize a Product</h1>
      <p className="text-sm text-gray-600 mb-4">
        Select a product and tell us how you want it customized.
      </p>

      <form className="space-y-3">

        {/* Product Select */}
        <div>
          <label className="block text-sm font-semibold mb-1">Choose Product</label>
          <select className="w-full p-2 border rounded-lg text-sm">
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
          <label className="block text-sm font-semibold mb-1">
            Upload Reference Image
          </label>
          <input
            type="file"
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>

        {/* Size & Height (side by side) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Size</label>
            <input
              type="text"
              placeholder="Small / Medium / Large"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Height</label>
            <input
              type="text"
              placeholder="e.g. 20cm"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-semibold mb-1">Contact</label>
          <input
            type="text"
            placeholder="Email or phone number"
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Customization Details
          </label>
          <textarea
            rows="3"
            placeholder="Describe your desired customization..."
            className="w-full p-2 border rounded-lg text-sm"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-red-700 hover:bg-red-800 text-white p-2 rounded-lg font-semibold text-sm transition"
        >
          Send Request
        </button>
      </form>
    </div>
  );
}

export default Customize;

