import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useProducts } from "../hooks/useProducts";

function UserLayout() {
  // Kick off the products fetch immediately so it's ready before the user navigates to /products
  useProducts();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default UserLayout;
