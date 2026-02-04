// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth(); // ✅ make sure AuthContext provides loading
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // wait until auth is known
      if (loading) return;

      // no user => not admin
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const ref = doc(db, "admins", user.uid);
        const snap = await getDoc(ref);
        setIsAdmin(snap.exists());
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
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
