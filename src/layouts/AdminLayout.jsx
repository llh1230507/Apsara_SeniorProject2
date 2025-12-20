import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar */}
        <div className="flex justify-end p-4 bg-white border-b">
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
