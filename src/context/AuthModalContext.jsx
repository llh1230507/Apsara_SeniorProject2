import { createContext, useContext, useMemo, useState } from "react";
import AuthModal from "../components/AuthModal";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultMode, setDefaultMode] = useState("login");
  const [redirectTo, setRedirectTo] = useState("/checkout");

  const openAuth = ({ mode = "login", redirect = "/checkout" } = {}) => {
    setDefaultMode(mode);
    setRedirectTo(redirect);
    setIsOpen(true);
  };

  const closeAuth = () => setIsOpen(false);

  const value = useMemo(
    () => ({ openAuth, closeAuth }),
    []
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}

      {/* 🔥 Modal rendered globally */}
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuth}
        defaultMode={defaultMode}
        redirectTo={redirectTo}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used inside AuthModalProvider");
  }
  return ctx;
}
