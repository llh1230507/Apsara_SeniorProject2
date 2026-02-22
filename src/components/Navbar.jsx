import {
  FaSearch,
  FaShoppingCart,
  FaHeart,
  FaUserCircle,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import SearchOverlay from "../components/SearchOverlay";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { useAuthModal } from "../context/AuthModalContext";

function Navbar() {
  const { isCartOpen, openCart, closeCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const location = useLocation();
  const { openAuth } = useAuthModal();

  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const navigate = useNavigate();
  const { user } = useAuth();

  const { favoritesCount } = useFavorites();

  const navLinkClass = ({ isActive }) =>
    `text-lg font-medium ${
      isActive ? "text-red-600 font-semibold" : "text-gray-700"
    } hover:text-red-600`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-5 py-3 text-base font-medium border-b border-gray-100 ${
      isActive ? "text-red-600 font-semibold" : "text-gray-700"
    } hover:bg-gray-50`;

  const handleLogout = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center px-4 md:px-6 py-4">
          <NavLink to="/" className="text-3xl font-bold text-red-700">
            Apsara
          </NavLink>

          {/* Desktop Menu */}
          <ul className="hidden md:flex gap-10 items-center">
            <li>
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/customize" className={navLinkClass}>
                Customize
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={navLinkClass}>
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Icons + Auth */}
          <div className="flex items-center gap-5 text-xl text-gray-700">
            <FaSearch
              onClick={() => setSearchOpen(true)}
              className="cursor-pointer hover:text-red-600"
            />

            <div
              className="relative cursor-pointer"
              onClick={openCart}
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

            {/* Auth — desktop only */}
            <div className="hidden md:block">
              {user ? (
                <div className="relative group">
                  <FaUserCircle className="text-2xl cursor-pointer hover:text-red-600" />
                  <div className="absolute right-0 top-full hidden group-hover:flex flex-col bg-white border shadow-lg rounded-md w-48 py-2">
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
                    <NavLink
                      to="/my-customizations"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      My Customizations
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
                  onClick={() =>
                    openAuth({
                      mode: "login",
                      redirectTo: location.pathname + location.search,
                    })
                  }
                  className="px-3 py-2 bg-red-700 text-white rounded hover:opacity-90 text-sm"
                >
                  Login
                </button>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="md:hidden text-gray-700 hover:text-red-600"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <NavLink
              to="/products"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </NavLink>
            <NavLink
              to="/customize"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Customize
            </NavLink>
            <NavLink
              to="/about"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </NavLink>
            <NavLink
              to="/contact"
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </NavLink>

            {/* Auth in mobile menu */}
            <div className="px-5 py-4">
              {user ? (
                <div className="space-y-2">
                  <NavLink
                    to="/profile"
                    className="block text-sm text-gray-700 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/orders"
                    className="block text-sm text-gray-700 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </NavLink>
                  <NavLink
                    to="/my-customizations"
                    className="block text-sm text-gray-700 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Customizations
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 py-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth({
                      mode: "login",
                      redirectTo: location.pathname + location.search,
                    });
                  }}
                  className="w-full px-4 py-2 bg-red-700 text-white rounded hover:opacity-90 text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}

export default Navbar;
