import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔐 TEMP login (replace with backend later)
    if (email === "admin@apsara.com" && password === "admin123") {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin");
    } else {
      setError("Invalid admin credentials");
    }
  };

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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@apsara.com"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Button */}
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

export default AdminLogin;
