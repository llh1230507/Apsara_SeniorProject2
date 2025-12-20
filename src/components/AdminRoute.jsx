import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isAdmin = localStorage.getItem("isAdmin");

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminRoute;
