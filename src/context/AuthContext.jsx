import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { syncLocalToFirestore } from "../services/userSync";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // ✅ When login happens, sync local cart/favorites -> Firestore
      if (currentUser) {
        try {
          await syncLocalToFirestore(currentUser.uid);
        } catch (e) {
          console.error("Sync local to Firestore failed:", e);
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
