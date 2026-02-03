export default function CustomizationOptions({
  color,
  setColor,
  size,
  setSize,
  material,
  setMaterial,
}) {
  return (
    <div className="space-y-4">
      
      {/* Color */}
      <div>
        <p className="font-semibold mb-1">Color</p>
        <div className="flex gap-2">
          {["natural", "black", "white", "gold"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`px-3 py-1 border rounded capitalize
                ${color === c ? "bg-black text-white" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <p className="font-semibold mb-1">Size</p>
        <div className="flex gap-2">
          {["small", "medium", "large"].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1 border rounded capitalize
                ${size === s ? "bg-black text-white" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      <div>
        <p className="font-semibold mb-1">Material</p>
        <div className="flex gap-2">
          {["wood", "stone", "metal"].map((m) => (
            <button
              key={m}
              onClick={() => setMaterial(m)}
              className={`px-3 py-1 border rounded capitalize
                ${material === m ? "bg-black text-white" : ""}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}