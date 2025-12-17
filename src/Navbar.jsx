import { FaSearch, FaShoppingCart, FaHeart } from "react-icons/fa";
import { NavLink, Routes, Route } from "react-router-dom";
import { useState } from "react";

// Pages
import Home from "./Home";
import Products from "./Products";
import Customize from "./Customize";
import About from "./About";
import Contact from "./Contact";
import Metal from "./Metal";
import Stone from "./stone";
import Wood from "./wood";
import ProductDetail from "./ProductDetail";
import Footer from "./components/Footer";
import SearchOverlay from "./components/SearchOverlay";
import Search from "./Search";

function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 ${
      isActive ? "text-red-700 font-semibold" : "text-gray-700"
    } hover:text-red-700 hover:bg-gray-50`;

  return (
    /* 🔑 flex + min-h-screen ensures footer stays at bottom */
    <div className="flex flex-col min-h-screen">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6 py-4">
          {/* Brand */}
          <NavLink
            to="/"
            className="text-3xl font-bold text-red-700 tracking-wide"
          >
            Apsara
          </NavLink>

          {/* Menu */}
          <ul className="flex gap-10 items-center">
            {/* PRODUCTS */}
            <li className="relative group">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `text-lg font-medium transition ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } group-hover:text-red-600`
                }
              >
                Products
              </NavLink>

              {/* Dropdown with images */}
              <ul className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border border-gray-200 shadow-lg rounded-md w-64 py-2">
                <li>
                  <NavLink to="/products/wood" className={dropdownLinkClass}>
                    <img
                      src="/product1.jpg"
                      alt="Wood"
                      className="w-16 h-16 object-cover rounded"
                    />
                    Wood
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/products/stone" className={dropdownLinkClass}>
                    <img
                      src="/product2.jpg"
                      alt="Stone"
                      className="w-16 h-16 object-cover rounded"
                    />
                    Stone
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/products/metal" className={dropdownLinkClass}>
                    <img
                      src="/product3.jpg"
                      alt="Metal"
                      className="w-16 h-16 object-cover rounded"
                    />
                    Metal
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* CUSTOMIZE */}
            <li>
              <NavLink
                to="/customize"
                className={({ isActive }) =>
                  `text-lg font-medium transition ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                Customize
              </NavLink>
            </li>

            {/* ABOUT */}
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-lg font-medium transition ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                About Us
              </NavLink>
            </li>

            {/* CONTACT */}
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `text-lg font-medium transition ${
                    isActive ? "text-red-600 font-semibold" : "text-gray-700"
                  } hover:text-red-600`
                }
              >
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Icons (❌ user icon removed) */}
          <div className="flex gap-6 text-xl text-gray-700">
            <FaSearch
              onClick={() => setSearchOpen(true)}
              className="hover:text-red-600 cursor-pointer"
              title="Search products"
            />
            <FaShoppingCart className="hover:text-red-600 cursor-pointer" />
            <FaHeart className="hover:text-red-600 cursor-pointer" />
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/metal" element={<Metal />} />
          <Route path="/products/wood" element={<Wood />} />
          <Route path="/products/stone" element={<Stone />} />
          <Route path="/products/metal/:id" element={<ProductDetail />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default Navbar;

//Fix the not scrolling up when pressing on the links
