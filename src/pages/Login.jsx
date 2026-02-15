import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

export default function Login({ onSuccess, onSwitch, redirectTo = "/checkout" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Login</h1>

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

        <input
          type="password"
          placeholder="Password"
          className="border p-3 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loadingEmail}
          className="bg-black text-white w-full py-3 rounded disabled:opacity-60"
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
        Don’t have an account?{" "}
        <button type="button" onClick={onSwitch} className="underline">
          Sign up
        </button>
      </p>
    </div>
  );
}
