import { Routes, Route } from "react-router-dom";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages (USER)
import Home from "./pages/Home";
import Products from "./pages/Products";
import Customize from "./pages/Customize";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Metal from "./pages/Metal";
import Stone from "./pages/Stone";
import Wood from "./pages/Wood";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";

// Pages (ADMIN)
import Dashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import Product from "./pages/admin/Product";
import Orders from "./pages/admin/Orders";
import Customize_Request from "./pages/admin/customize_request";
// Auth Guard
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Routes>
      {/* ================= USER ================= */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/wood" element={<Wood />} />
        <Route path="/products/stone" element={<Stone />} />
        <Route path="/products/metal" element={<Metal />} />
        <Route path="/products/:category/:id" element={<ProductDetail />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
         <Route path="product" element={<Product />} />
        <Route path="orders" element={<Orders />} />  
        <Route path="customize" element={<Customize_Request />} />
      </Route>
    </Routes>
  );
}

export default App;
