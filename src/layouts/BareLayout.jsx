// src/layouts/BareLayout.jsx
import { Outlet, NavLink } from "react-router-dom";

export default function BareLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand bar */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <NavLink
            to="/"
            className="text-4xl font-bold text-red-700"
          >
            Apsara
          </NavLink>
        </div>
      </header>

      {/* Page content */}
      <main className="py-8">
        <Outlet />
      </main>
    </div>
  );
}
