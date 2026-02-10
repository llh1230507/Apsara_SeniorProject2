import { useEffect, useState } from "react";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login", // "login" | "signup"
  redirectTo = "/checkout", // where to go after login/signup (optional)
}) {
  const [mode, setMode] = useState(defaultMode);

  useEffect(() => {
    if (isOpen) setMode(defaultMode);
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-2xl leading-none"
            aria-label="Close"
            type="button"
          >
            ×
          </button>

          {mode === "login" ? (
            <Login
              onSuccess={onClose}
              onSwitch={() => setMode("signup")}
              redirectTo={redirectTo}
            />
          ) : (
            <Signup
              onSuccess={onClose}
              onSwitch={() => setMode("login")}
              redirectTo={redirectTo}
            />
          )}
        </div>
      </div>
    </>
  );
}
