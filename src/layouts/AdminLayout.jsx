import { Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
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
            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
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
