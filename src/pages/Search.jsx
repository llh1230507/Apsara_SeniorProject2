import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import products from "../assets/productsData";

function ResultCard({ p }) {
  const link =
    p.category === "metal" && p.id <= 999
      ? `/products/metal/${p.id}`
      : `/products/${p.category}`;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group">
      <div className="h-48 w-full overflow-hidden">
        <img
          src={p.image}
          alt={p.name}
          className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{p.name}</h3>
        <p className="text-gray-600 mt-1">${p.price}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {p.category}
          </span>
          <Link
            to={link}
            className="text-sm bg-[#8b4513] text-white px-3 py-1.5 rounded-lg hover:bg-[#6b3410]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function Search() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const results = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return [];
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [q]);

  return (
    <div className="pt-20 pb-12 px-6 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold">Search Results</h1>
        <p className="text-gray-600 mt-1">
          {q ? `for "${q}"` : "Enter a search term above."}
        </p>

        {q && results.length === 0 && (
          <div className="mt-10 text-gray-600">No products found.</div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {results.map((p) => (
              <ResultCard key={`${p.category}-${p.id}`} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
