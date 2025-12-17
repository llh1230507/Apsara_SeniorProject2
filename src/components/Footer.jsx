import { FaFacebookF, FaInstagram, FaTwitter, FaArrowUp } from "react-icons/fa";
import { NavLink } from "react-router-dom";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto relative">
      <div className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">
            <NavLink
              to="/"
              className="text-white hover:text-gray-200 transition"
            >
              Apsara
            </NavLink>
          </h2>
          <p className="text-sm">
            Handcrafted Khmer art preserving culture through timeless
            sculptures.
          </p>
        </div>
        {/* Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink
                to="/products"
                className="text-gray-400 hover:text-white transition"
              >
                Products
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/customize"
                className="text-gray-400 hover:text-white transition"
              >
                Customize
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/about"
                className="text-gray-400 hover:text-white transition"
              >
                About
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/contact"
                className="text-gray-400 hover:text-white transition"
              >
                Contact
              </NavLink>
            </li>
          </ul>
        </div>
        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Follow Us</h3>
          <div className="flex gap-4 text-xl">
            <a
              href="https://facebook.com/apsarapenhche"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-blue-600 transition"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://instagram.com/apsarapenhchet2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-pink-500 transition"
            >
              <FaInstagram />
            </a>

            <a
              href="https://x.com/apsarapenhchet"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-black transition"
            >
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © {new Date().getFullYear()} Apsara. All rights reserved.
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 bg-red-700 text-white p-3 rounded-full shadow-lg hover:bg-red-800 transition z-50"
        aria-label="Back to top"
      >
        <FaArrowUp />
      </button>
    </footer>
  );
}

export default Footer;
