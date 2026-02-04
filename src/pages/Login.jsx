import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate, NavLink } from "react-router-dom";
import { auth } from "../firebase";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingEmail(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/checkout");
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
      await signInWithPopup(auth, provider);
      navigate("/checkout");
    } catch (err) {
      // user closed popup is common
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in cancelled.");
      } else {
        setError(err.message);
      }
      console.log("Google login error:", err.code, err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}


      

      {/* Email/password */}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-3 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-3 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loadingEmail}
          className="bg-black text-white w-full py-3 disabled:opacity-60"
        >
          {loadingEmail ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center gap-3 mb-4">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      
      {/* Google */}
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
        <NavLink to="/signup" className="underline">
          Sign up
        </NavLink>
      </p>
    </div>
  );
}
