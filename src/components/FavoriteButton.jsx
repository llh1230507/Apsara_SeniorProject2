import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useEffect, useState } from "react";

function FavoriteButton({ product }) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("favorites")) || [];
    setIsFav(stored.some(item => item.id === product.id));
  }, [product.id]);

  const toggleFavorite = () => {
    let stored = JSON.parse(localStorage.getItem("favorites")) || [];

    if (isFav) {
      stored = stored.filter(item => item.id !== product.id);
    } else {
      stored.push({
        id: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        basePrice: product.basePrice,
      });
    }

    localStorage.setItem("favorites", JSON.stringify(stored));
    setIsFav(!isFav);
  };

  return (
    <button onClick={toggleFavorite} className="text-xl">
      {isFav ? (
        <FaHeart className="text-red-600" />
      ) : (
        <FaRegHeart className="text-gray-400 hover:text-red-600" />
      )}
    </button>
  );
}

export default FavoriteButton;
