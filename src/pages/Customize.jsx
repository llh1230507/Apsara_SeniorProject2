// src/pages/Customize.jsx
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Customize() {
  const { user } = useAuth();

  const [productName, setProductName] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

  // ✅ split fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [details, setDetails] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ✅ prefill email from auth (editable)
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  // ✅ NO setState in render
  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4 text-gray-800">
        <h1 className="text-2xl font-bold mb-1">Customize a Product</h1>
        <p className="text-sm text-gray-600 mb-4">
          Tell us how you want it customized.
        </p>

        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
          Please login to send a customization request.
        </div>
      </div>
    );
  }

  const isValidEmail = (value) => {
    // simple good-enough validation for forms
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    // ✅ submit-time guard
    if (!user) {
      setError("Please login to send a customization request.");
      return;
    }

    if (!productName.trim()) return setError("Please enter a product name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email.trim())) return setError("Please enter a valid email.");
    if (!details.trim())
      return setError("Please describe your customization request.");

    setLoading(true);

    try {
      // 1) Upload image (optional)
      let imageUrl = "";
      if (file) {
        const ext = file.name?.split(".").pop() || "jpg";
        const path = `customizationRequests/${user.uid}/${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 2) Save request to Firestore
      await addDoc(collection(db, "customizationRequests"), {
        productName: productName.trim(),
        size: {
          height: Number(height || 0),
          width: Number(width || 0),
          length: Number(length || 0),
        },

        // ✅ separated
        email: email.trim().toLowerCase(),
        phone: phone.trim(),

        details: details.trim(),
        imageUrl, // "" if none
        status: "pending",

        // user info
        userId: user.uid,
        userEmail: user.email || null,

        createdAt: serverTimestamp(),
      });

      setMsg("Request sent ✅ We will contact you soon.");

      // reset
      setProductName("");
      setHeight("");
      setWidth("");
      setLength("");
      setPhone("");
      setDetails("");
      setFile(null);
      // keep email filled (optional). If you want to reset it, uncomment:
      // setEmail(user.email || "");
    } catch (err) {
      console.error(err);
      setError("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 text-gray-800">
      <h1 className="text-2xl font-bold mb-1">Customize a Product</h1>
      <p className="text-sm text-gray-600 mb-4">
        Tell us how you want it customized.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}</div>
      )}
      {msg && (
        <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
          {msg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold mb-1">Product</label>
          <input
            type="text"
            placeholder="Product Name"
            className="w-full p-2 border rounded-lg text-sm"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>

        {/* Upload Image */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Upload Reference Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 border rounded-lg text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Size */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Height</label>
            <input
              type="number"
              placeholder="cm"
              className="w-full p-2 border rounded-lg text-sm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Width</label>
            <input
              type="number"
              placeholder="cm"
              className="w-full p-2 border rounded-lg text-sm"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Length</label>
            <input
              type="number"
              placeholder="cm"
              className="w-full p-2 border rounded-lg text-sm"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>
        </div>

        {/* ✅ Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Email *</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 border rounded-lg text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full p-2 border rounded-lg text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Customization Details
          </label>
          <textarea
            rows="3"
            placeholder="Describe your desired customization..."
            className="w-full p-2 border rounded-lg text-sm"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white p-2 rounded-lg font-semibold text-sm transition"
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}
          