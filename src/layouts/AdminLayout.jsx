import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Simple title mapper (you can expand later)
  const pageTitle = (() => {
    if (location.pathname.startsWith("/admin/product")) return "Products";
    if (location.pathname.startsWith("/admin/orders")) return "Orders";
    if (location.pathname.startsWith("/admin/customize")) return "Customization Requests";
    if (location.pathname.startsWith("/admin/users")) return "Users";
    return "Dashboard";
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (fixed) */}
      <AdminSidebar isOpen={sidebarOpen} />

      {/* Main area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Topbar (sticky) */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="p-2 rounded-lg border hover:bg-gray-50 active:scale-[0.98] transition"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="leading-tight">
                <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
              </div>
            </div>

            {/* Right-side area (future: profile menu) */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">Online</span>
              </div>

              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
