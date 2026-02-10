import { useEffect, useState } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 🔄 Load profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      // From Firebase Auth
      setName(user.displayName || "");

      // From Firestore
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    };

    loadProfile();
  }, [user]);

  // 💾 Save profile
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Update Firebase Auth name
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      // Save extra info to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          phone,
          address,
          email: user.email,
        },
        { merge: true }
      );

      setMessage("Profile updated successfully ✅");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile ❌");
    } finally {
      setSaving(false);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto mt-24 mb-24 p-6 border rounded bg-white">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <p className="mb-4 text-sm text-gray-600">
        <span className="font-medium">Email:</span> {user.email}
      </p>

      {message && (
        <p className="mb-4 text-sm text-green-600">{message}</p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          className="border p-3 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Phone (optional)"
          className="border p-3 w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <textarea
          placeholder="Address (optional)"
          className="border p-3 w-full"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white w-full py-3 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="mt-4 text-sm text-red-600 w-full underline"
      >
        Logout
      </button>
    </div>
  );
}
