// src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // check if this user is in admins collection
      const adminRef = doc(db, "admins", cred.user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        setError("This account is not an admin.");
        return;
      }

      navigate("/admin");
    } catch (err) {
      if (err.code === "auth/invalid-credential")
        setError("Wrong email or password.");
      else setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-email"
      )
        setResetError("No account found with that email address.");
      else setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Forgot password view ───────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center text-red-700 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            Enter your admin email and we'll send a reset link.
          </p>

          {resetSent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
              Password reset email sent to <strong>{resetEmail}</strong>. Check
              your inbox (and spam folder).
            </div>
          ) : (
            <>
              {resetError && (
                <p className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
                  {resetError}
                </p>
              )}
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition disabled:opacity-60"
                >
                  {resetLoading ? "Sending..." : "Send Reset Email"}
                </button>
              </form>
            </>
          )}

          <p className="text-sm text-center mt-5">
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setResetSent(false);
                setResetEmail("");
                setResetError("");
              }}
              className="underline text-gray-600"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Normal admin login view ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-red-700 mb-6">
          Admin Login
        </h1>

        {error && (
          <p className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setResetEmail(email);
                }}
                className="text-xs text-red-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition"
          >
            Login
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          For admin use only
        </p>
      </div>
    </div>
  );
}
