import { FaSearch, FaShoppingCart, FaHeart } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import SearchOverlay from "../components/SearchOverlay";

function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  const dropdownLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 ${
      isActive ? "text-red-700 font-semibold" : "text-gray-700"
    } hover:text-red-700 hover:bg-gray-50`;

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6 py-4">
          {/* Brand */}
          <NavLink to="/" className="text-3xl font-bold text-red-700">
            Apsara
          </NavLink>

          {/* Menu */}
          <ul className="flex gap-10 items-center">
            {/* PRODUCTS */}
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

              {/* Dropdown */}
              <ul className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border shadow-lg rounded-md w-64 py-2">
                <li>
                  <NavLink to="/products/wood" className={dropdownLinkClass}>
                    <img src="/product1.jpg" alt="Wood" className="w-16 h-16 rounded" />
                    Wood
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/products/stone" className={dropdownLinkClass}>
                    <img src="/product2.jpg" alt="Stone" className="w-16 h-16 rounded" />
                    Stone
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/products/metal" className={dropdownLinkClass}>
                    <img src="/product3.jpg" alt="Metal" className="w-16 h-16 rounded" />
                    Metal
                  </NavLink>
                </li>
              </ul>
            </li>

            <li>
              <NavLink to="/customize" className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }>
                Customize
              </NavLink>
            </li>

            <li>
              <NavLink to="/about" className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }>
                About Us
              </NavLink>
            </li>

            <li>
              <NavLink to="/contact" className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }>
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Icons */}
          <div className="flex gap-6 text-xl text-gray-700">
            <FaSearch
              onClick={() => setSearchOpen(true)}
              className="cursor-pointer hover:text-red-600"
            />
            <FaShoppingCart className="cursor-pointer hover:text-red-600" />
            <FaHeart className="cursor-pointer hover:text-red-600" />
          </div>
        </div>
      </nav>

      {/* SEARCH OVERLAY */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Navbar;
