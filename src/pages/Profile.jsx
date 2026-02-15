import { useEffect, useState } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success"); // "success" | "error"

  // 🔄 Load profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      // From Firebase Auth
      setDisplayName(user.displayName || "");

      // From Firestore
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        // ✅ keep naming consistent
        setDisplayName(data.displayName ?? user.displayName ?? "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } else {
        // ✅ ensure doc exists for older accounts / google logins
        await setDoc(
          ref,
          {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            provider: user.providerData?.[0]?.providerId || "unknown",
            role: "user",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    };

    loadProfile();
  }, [user]);

  // 💾 Save profile
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");
    setMessageType("success");

    try {
      // Update Firebase Auth display name
      await updateProfile(auth.currentUser, {
        displayName: displayName || "",
      });

      // Save extra info to Firestore (merge)
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: displayName || "",
          phone: phone || "",
          address: address || "",
          photoURL: user.photoURL || "",
          provider: user.providerData?.[0]?.providerId || "unknown",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profile updated successfully ✅");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile ❌");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 border rounded bg-white">
        <p className="text-gray-600">Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-24 mb-24 p-6 border rounded-xl bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <p className="mb-4 text-sm text-gray-600 break-all">
        <span className="font-medium">Email:</span> {user.email}
      </p>

      {message && (
        <p
          className={`mb-4 text-sm ${
            messageType === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            className="border p-3 w-full rounded"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            type="text"
            placeholder="Phone"
            className="border p-3 w-full rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Address (optional)
          </label>
          <textarea
            placeholder="Address"
            className="border p-3 w-full rounded"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white w-full py-3 rounded disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="mt-4 text-sm text-red-600 w-full underline"
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
