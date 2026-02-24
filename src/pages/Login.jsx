import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

export default function Login({
  onSuccess,
  onSwitch,
  redirectTo = "/checkout",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const navigate = useNavigate();

  // ✅ Create/Update user doc in Firestore for Admin user list
  const upsertUserDoc = async (u) => {
    if (!u) return;

    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);

    const baseData = {
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      photoURL: u.photoURL || "",
      provider: u.providerData?.[0]?.providerId || "unknown",
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      // first time user
      await setDoc(ref, {
        ...baseData,
        role: "user",
        createdAt: serverTimestamp(),
      });
    } else {
      // existing user: DO NOT touch role/createdAt
      await updateDoc(ref, baseData);
    }
  };

  const afterAuth = () => {
    if (onSuccess) onSuccess(); // modal mode -> close
    navigate(redirectTo);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingEmail(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await upsertUserDoc(cred.user);
      afterAuth();
    } catch (err) {
      if (err.code === "auth/invalid-credential")
        setError("Wrong email or password.");
      else if (err.code === "auth/invalid-email")
        setError("Invalid email address.");
      else setError(err.message);

      console.log("Login error:", err.code, err.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoadingGoogle(true);

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await upsertUserDoc(cred.user);
      afterAuth();
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user")
        setError("Google sign-in cancelled.");
      else setError(err.message);

      console.log("Google login error:", err.code, err.message);
    } finally {
      setLoadingGoogle(false);
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
      <div>
        <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
        <p className="text-sm text-gray-500 mb-4">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {resetSent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
            Password reset email sent to <strong>{resetEmail}</strong>. Check
            your inbox (and spam folder).
          </div>
        ) : (
          <>
            {resetError && (
              <p className="text-red-600 mb-3 text-sm">{resetError}</p>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="email"
                placeholder="Your email address"
                className="border p-3 w-full rounded"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button
                disabled={resetLoading}
                className="bg-red-700 text-white w-full py-3 rounded disabled:opacity-60"
              >
                {resetLoading ? "Sending..." : "Send Reset Email"}
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-center mt-4">
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
    );
  }

  // ── Normal login view ──────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 ">Login</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-3 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div>
          <input
            type="password"
            placeholder="Password"
            className="border p-3 w-full rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          disabled={loadingEmail}
          className="bg-red-700 text-white w-full py-3 rounded disabled:opacity-60"
        >
          {loadingEmail ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-sm text-gray-500">or</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 border py-3 rounded hover:bg-gray-50 disabled:opacity-60"
        >
          <FcGoogle className="text-xl" />
          {loadingGoogle ? "Signing in..." : "Continue with Google"}
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch} className="underline">
          Sign up
        </button>
      </p>
    </div>
  );
}
