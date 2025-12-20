// /c:/Users/Cs-Store/apsara-seniorproject2/src/components/admin/AdminSidebar.jsx
import { NavLink } from "react-router-dom";
import { FaHome, FaBox, FaShoppingCart, FaTools } from "react-icons/fa";

export default function AdminSidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
     ${isActive ? "bg-red-700 text-white" : "text-gray-700 hover:bg-gray-100"}`;

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <h2 className="text-xl font-bold text-red-700 mb-6">Admin Panel</h2>

      <nav className="space-y-2">
        <NavLink to="/admin" end className={linkClass}>
          <FaHome /> Dashboard
        </NavLink>

        <NavLink to="/admin/product" className={linkClass}>
          <FaBox /> Products
        </NavLink>

        <NavLink to="/admin/orders" className={linkClass}>
          <FaShoppingCart /> Orders
        </NavLink>

        <NavLink to="/admin/customize" className={linkClass}>
          <FaTools /> Customization Requests
        </NavLink>
      </nav>
    </aside>
  );
}
