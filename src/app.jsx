import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Layouts (always needed — keep eager)
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import BareLayout from "./layouts/BareLayout";

// Route guards (always needed — keep eager)
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// USER pages (lazy loaded)
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Customize = lazy(() => import("./pages/Customize"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Search = lazy(() => import("./pages/Search"));
const Cart = lazy(() => import("./pages/Cart"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSucess"));
const Profile = lazy(() => import("./pages/Profile"));
const UserOrders = lazy(() => import("./pages/UserOrders"));

// ADMIN pages (lazy loaded)
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Product = lazy(() => import("./pages/admin/Product"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const CustomizeRequest = lazy(() => import("./pages/admin/CustomizeRequest"));
const Users = lazy(() => import("./pages/admin/Users"));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <Routes>
        {/* ================= USER (with Navbar/Footer) ================= */}
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

          {/* 🔐 USER AUTH REQUIRED (still with Navbar/Footer) */}
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
        </Route>

        {/* ================= BARE (no Navbar/Footer) ================= */}
        <Route element={<BareLayout />}>
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
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
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
