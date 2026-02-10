import { Routes, Route } from "react-router-dom";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// USER pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import Customize from "./pages/Customize";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Favorites from "./pages/Favorites";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSucess";

import Profile from "./pages/Profile";
import UserOrders from "./pages/UserOrders";
import CategoryProducts from "./pages/CategoryProducts";

// ADMIN pages
import Dashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import Product from "./pages/admin/Product";
import Orders from "./pages/admin/Orders";
import CustomizeRequest from "./pages/admin/CustomizeRequest";

// Route guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

function App() {
  return (
    <Routes>
      {/* ================= USER ================= */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:category/:id" element={<ProductDetail />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/products/:category" element={<CategoryProducts />} />
        

        {/* 🔐 USER AUTH REQUIRED */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <UserOrders />
            </ProtectedRoute>
          }
        />



        <Route path="/order-success" element={<OrderSuccess />} />
        
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
        <Route path="customize" element={<CustomizeRequest />} />
      </Route>
    </Routes>
  );
}

export default App;
