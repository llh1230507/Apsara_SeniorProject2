import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <p className="mb-6">
        <span className="font-medium">Email:</span> {user.email}
      </p>

      <button
        onClick={handleLogout}
        className="bg-black text-white w-full py-3"
      >
        Logout
      </button>
    </div>
  );
}
