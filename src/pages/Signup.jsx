import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { FcGoogle } from "react-icons/fc";

export default function Signup({ onSuccess, onSwitch, redirectTo = "/" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const navigate = useNavigate();

  const afterAuth = () => {
    if (onSuccess) onSuccess();  // close modal
    navigate(redirectTo);
  };

  const handleGoogle = async () => {
    setError("");
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      afterAuth();
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") setError("Google sign-in cancelled.");
      else setError(err.message);
      console.log("Google signup error:", err.code, err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoadingEmail(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      afterAuth();
    } catch (err) {
      if (err.code === "auth/email-already-in-use")
        setError("This email is already registered. Try logging in.");
      else if (err.code === "auth/weak-password")
        setError("Password is too weak. Use at least 6 characters.");
      else setError(err.message);

      console.log("Signup error:", err.code, err.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create an account</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-3 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          className="border p-3 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="border p-3 w-full rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          disabled={loadingEmail}
          className="bg-black text-white w-full py-3 rounded disabled:opacity-60"
        >
          {loadingEmail ? "Creating..." : "Sign Up"}
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
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="underline">
          Login
        </button>
      </p>
    </div>
  );
}
