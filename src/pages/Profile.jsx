import { useEffect, useState } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const COUNTRIES = [
  "Thailand",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Vietnam",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Philippines",
  "Brunei",
  "China",
  "Japan",
  "South Korea",
  "India",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "Pakistan",
  "Australia",
  "New Zealand",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Russia",
  "Ukraine",
  "Turkey",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Israel",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Argentina",
  "Mexico",
  "Colombia",
  "Chile",
  "Peru",
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Thailand");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        setFirstName(d.firstName || "");
        setLastName(d.lastName || "");
        setPhone(d.phone || "");
        setHouseNumber(d.houseNumber || "");
        setStreet(d.street || "");
        setCity(d.city || "");
        setProvince(d.province || "");
        setCountry(d.country || "Thailand");
        setPostalCode(d.postalCode || "");
      } else {
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
          { merge: true },
        );
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const displayName = `${firstName} ${lastName}`.trim();

      await updateProfile(auth.currentUser, { displayName });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName,
          firstName,
          lastName,
          phone,
          houseNumber,
          street,
          city,
          province,
          country,
          postalCode,
          photoURL: user.photoURL || "",
          provider: user.providerData?.[0]?.providerId || "unknown",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
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
    <div className="max-w-lg mx-auto mt-24 mb-24 p-6 border rounded-xl bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <p className="mb-4 text-sm text-gray-600 break-all">
        <span className="font-medium">Email:</span> {user.email}
      </p>

      {message && (
        <p
          className={`mb-4 text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              placeholder="First name"
              className="border p-3 w-full rounded-lg"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Last name"
              className="border p-3 w-full rounded-lg"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            type="text"
            placeholder="Phone number"
            className="border p-3 w-full rounded-lg"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Address</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                House No. / Building
              </label>
              <input
                type="text"
                placeholder="House No. / Building"
                className="border p-3 w-full rounded-lg text-sm"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Street / Road</label>
              <input
                type="text"
                placeholder="Street / Road"
                className="border p-3 w-full rounded-lg text-sm"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">City / District</label>
              <input
                type="text"
                placeholder="City / District"
                className="border p-3 w-full rounded-lg text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Province / State</label>
              <input
                type="text"
                placeholder="Province / State"
                className="border p-3 w-full rounded-lg text-sm"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Postal Code</label>
            <input
              type="text"
              placeholder="Postal Code"
              className="border p-3 w-full rounded-lg text-sm"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Country</label>
            <select
              className="border p-3 w-full rounded-lg text-sm bg-white"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white w-full py-3 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="mt-3 bg-red-700 text-white w-full py-3 rounded-lg"
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
