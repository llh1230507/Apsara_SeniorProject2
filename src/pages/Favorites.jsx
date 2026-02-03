import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Favorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(stored);
  }, []);

  const removeFavorite = (id) => {
    const updated = favorites.filter((item) => item.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  if (!favorites.length) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">No Favorites Yet</h1>
        <p className="text-gray-600 mb-6">Save products you love for later</p>
        <NavLink
          to="/products"
          className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800"
        >
          Browse Products
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Favorites</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {favorites.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow p-4">
            <img
              src={Object.values(item.images || {})[0]}
              alt={item.name}
              className="h-48 w-full object-cover rounded-lg"
            />

            <h2 className="text-lg font-semibold mt-4">{item.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{item.category}</p>

            <p className="text-red-700 font-semibold mt-2">${item.price}</p>

            <div className="flex justify-between mt-4">
              <NavLink
                to={`/products/${item.category}/${item.id}`}
                className="text-sm text-red-700 hover:underline"
              >
                View
              </NavLink>

              <button
                onClick={() => removeFavorite(item.id)}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Favorites;
