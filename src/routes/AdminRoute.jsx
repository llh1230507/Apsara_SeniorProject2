// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      // Wait for auth to resolve
      if (loading) return;

      // Not logged in => not admin
      if (!user) {
        if (!alive) return;
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (!alive) return;
        setIsAdmin(snap.exists());
      } catch (err) {
        console.error("Admin check failed:", err);
        if (!alive) return;
        setIsAdmin(false);
      } finally {
        if (!alive) return;
        setChecking(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Checking admin access...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
