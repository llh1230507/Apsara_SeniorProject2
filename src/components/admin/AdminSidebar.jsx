import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaTools,
  FaSignOutAlt,
  FaUser
} from "react-icons/fa";

export default function AdminSidebar({ isOpen = true }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
     ${
       isActive
         ? "bg-red-700 text-white shadow-sm"
         : "text-gray-700 hover:bg-gray-100"
     }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300
      ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold">
            A
          </div>

          {isOpen && (
            <div className="leading-tight">
              <h2 className="text-sm font-bold text-gray-900">Apsara Admin</h2>
              <p className="text-xs text-gray-500">Management Console</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-2">
        <NavLink to="/admin" end className={linkClass} title="Dashboard">
          <FaHome className="text-lg shrink-0" />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/admin/product" className={linkClass} title="Products">
          <FaBox className="text-lg shrink-0" />
          {isOpen && <span>Products</span>}
        </NavLink>

        <NavLink to="/admin/orders" className={linkClass} title="Orders">
          <FaShoppingCart className="text-lg shrink-0" />
          {isOpen && <span>Orders</span>}
        </NavLink>

        <NavLink to="/admin/customize" className={linkClass} title="Customization Requests">
          <FaTools className="text-lg shrink-0" />
          {isOpen && <span>Customization Requests</span>}
        </NavLink>

        <NavLink to="/admin/users" className={linkClass} title="Users">
          <FaUser className="text-lg shrink-0" />
          {isOpen && <span>Users</span>}
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
          bg-red-700 text-white hover:bg-red-600`}
          title="Logout"
        >
          <FaSignOutAlt className="text-lg" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
