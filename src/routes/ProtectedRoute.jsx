import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      openAuth({ mode: "login", redirect: location.pathname });
    }
  }, [user, openAuth, location.pathname]);

  if (!user) {
    // stay in app, show modal, and prevent accessing protected content
    return <Navigate to="/" replace />;
  }

  return children;
}
