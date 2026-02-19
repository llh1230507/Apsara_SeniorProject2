import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const getThumb = (p) => p?.imageUrl || Object.values(p?.images || {})[0] || "";

function ResultCard({ p }) {
  const link = `/products/${p.category}/${p.id}`;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group">
      <div className="h-48 w-full overflow-hidden">
        <img
          src={getThumb(p)}
          alt={p.name}
          className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{p.name}</h3>
        <p className="text-gray-600 mt-1">${Number(p.price || 0).toFixed(2)}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {p.category}
          </span>
          <Link
            to={link}
            className="text-sm bg-red-700 text-white px-3 py-1.5 rounded-lg hover:bg-red-800"
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

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "products"), limit(50)));
        setAllProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Search page load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const results = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return [];
    return allProducts.filter((p) =>
      String(p?.name || "").toLowerCase().includes(term)
    );
  }, [q, allProducts]);

  return (
    <div className="pt-20 pb-12 px-6 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold">Search Results</h1>
        <p className="text-gray-600 mt-1">
          {q ? `for "${q}"` : "Enter a search term above."}
        </p>

        {loading && <div className="mt-10 text-gray-600">Loading…</div>}

        {!loading && q && results.length === 0 && (
          <div className="mt-10 text-gray-600">No products found.</div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {results.map((p) => (
              <ResultCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
