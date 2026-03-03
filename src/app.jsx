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
const MyCustomizations = lazy(() => import("./pages/MyCustomizations"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ADMIN pages (lazy loaded)
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Product = lazy(() => import("./pages/admin/Product"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const CustomizeRequest = lazy(() => import("./pages/admin/CustomizeRequest"));
const Users = lazy(() => import("./pages/admin/Users"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const ReturnRequests = lazy(() => import("./pages/admin/ReturnRequests"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));

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
          <Route path="/return-policy" element={<ReturnPolicy />} />

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
          <Route
            path="/my-customizations"
            element={
              <ProtectedRoute>
                <MyCustomizations />
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
          <Route path="categories" element={<Categories />} />
          <Route path="returns" element={<ReturnRequests />} />
        </Route>
        {/* 404 Not Found Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
