import {
  FaSearch,
  FaShoppingCart,
  FaHeart,
  FaUserCircle,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchOverlay from "../components/SearchOverlay";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AuthModal from "../components/AuthModal";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";



function Navbar() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { cartItems } = useCart();

const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);


  const navigate = useNavigate();
  const { user } = useAuth();

  const { favoritesCount } = useFavorites();


  const dropdownLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 ${
      isActive ? "text-red-700 font-semibold" : "text-gray-700"
    } hover:text-red-700 hover:bg-gray-50`;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6 py-4">
          <NavLink to="/" className="text-3xl font-bold text-red-700">
            Apsara
          </NavLink>

          {/* Menu */}
          <ul className="flex gap-10 items-center">
            <li className="relative group">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } group-hover:text-red-600`
                }
              >
                Products
              </NavLink>

              <ul className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-lg rounded-md w-64 py-2">
                <li>
                  <NavLink to="/products/wood" className={dropdownLinkClass}>
                    <img
                      src="/product1.jpg"
                      alt="Wood"
                      className="w-16 h-16 rounded"
                    />
                    Wood
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/products/stone" className={dropdownLinkClass}>
                    <img
                      src="/2.jpg"
                      alt="Stone"
                      className="w-16 h-16 rounded"
                    />
                    Stone
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/products/furniture"
                    className={dropdownLinkClass}
                  >
                    <img
                      src="/product3.jpg"
                      alt="Furniture"
                      className="w-16 h-16 rounded"
                    />
                    Furniture
                  </NavLink>
                </li>
              </ul>
            </li>

            <li>
              <NavLink
                to="/customize"
                className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                Customize
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                About Us
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Icons + Auth */}
          <div className="flex items-center gap-6 text-xl text-gray-700">
            <FaSearch
              onClick={() => setSearchOpen(true)}
              className="cursor-pointer hover:text-red-600"
            />

            <div
              className="relative cursor-pointer"
              onClick={() => setCartOpen(true)}
              title="Cart"
            >
              <FaShoppingCart className="hover:text-red-600" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            <NavLink to="/favorites" className="relative" title="Favorites">
              <FaHeart className="cursor-pointer hover:text-red-600" />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </NavLink>

            {/* Auth buttons */}
            {user ? (
              <div className="relative group">
                {/* Profile Icon */}
                <FaUserCircle className="text-2xl cursor-pointer hover:text-red-600" />

                {/* Dropdown */}
                <div className="absolute right-0 top-full hidden group-hover:flex flex-col bg-white border shadow-lg rounded-md w-64 py-2">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    My Profile
                  </NavLink>

                  <NavLink
                    to="/orders"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    My Orders
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
  type="button"
  onClick={() => {
    console.log("LOGIN MODAL OPEN");
    setAuthOpen(true);
  }}
  className="px-3 py-2 bg-black text-white rounded hover:opacity-90 text-sm"
>
  Login
</button>

            )}
          </div>
        </div>
      </nav>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode="login"
        redirectTo="/checkout"
      />
    </>
  );
}

export default Navbar;
