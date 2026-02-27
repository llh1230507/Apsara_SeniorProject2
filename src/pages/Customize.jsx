// src/pages/Customize.jsx
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import useCategories from "../hooks/useCategories";

export default function Customize() {
  const { user } = useAuth();
  const { categories: CATEGORIES } = useCategories();

  const [category, setCategory] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  const [details, setDetails] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  // prefill email from auth (editable)
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

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

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!user) {
      setError("Please login to send a customization request.");
      return;
    }

    if (!category) return setError("Please select a product category.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email.trim()))
      return setError("Please enter a valid email address.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    if (!/^\+?[\d\s\-()\[\]]{7,20}$/.test(phone.trim()))
      return setError(
        "Please enter a valid phone number (digits only, 7–20 characters).",
      );
    const h = Number(height);
    const w = Number(width);
    const l = Number(length);
    if (!height || !width || !length || h <= 0 || w <= 0 || l <= 0)
      return setError("Height, width, and length must be greater than 0.");
    if (!file) return setError("Please upload a reference image.");
    if (!completionDate)
      return setError("Please select your desired completion date.");
    if (!details.trim())
      return setError("Please describe your customization request.");
    if (!captchaToken)
      return setError("Please complete the reCAPTCHA verification.");

    setLoading(true);

    try {
      // Upload image (required)
      const ext = file.name?.split(".").pop() || "jpg";
      const path = `customizationRequests/${user.uid}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Save request to Firestore
      await addDoc(collection(db, "customizationRequests"), {
        category,
        size: {
          height: Number(height || 0),
          width: Number(width || 0),
          length: Number(length || 0),
        },
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        desiredCompletionDate: completionDate,
        details: details.trim(),
        imageUrl,
        status: "pending",
        userId: user.uid,
        userEmail: user.email || null,
        createdAt: serverTimestamp(),
      });

      setMsg("Request sent ✅ We will contact you soon.");

      // reset form
      setCategory("");
      setHeight("");
      setWidth("");
      setLength("");
      setPhone("");
      setCompletionDate("");
      setDetails("");
      setFile(null);
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
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
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
          {msg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Product Category Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Product Category *
          </label>
          <select
            className="w-full p-2 border rounded-lg text-sm bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Image — required */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Reference Image *
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 border rounded-lg text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        {/* Size */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Height *</label>
            <input
              type="number"
              placeholder="cm"
              min="1"
              className="w-full p-2 border rounded-lg text-sm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Width *</label>
            <input
              type="number"
              placeholder="cm"
              min="1"
              className="w-full p-2 border rounded-lg text-sm"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Length *</label>
            <input
              type="number"
              placeholder="cm"
              min="1"
              className="w-full p-2 border rounded-lg text-sm"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Email + Phone — both required */}
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
            <label className="block text-sm font-semibold mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              placeholder="Phone number"
              className="w-full p-2 border rounded-lg text-sm"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/[^\d\s+\-()\[\]]/g, ""))
              }
              required
            />
          </div>
        </div>

        {/* Desired Completion Date */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Desired Completion Date *
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-lg text-sm"
            value={completionDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setCompletionDate(e.target.value)}
            required
          />
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Customization Details *
          </label>
          <textarea
            rows="3"
            placeholder="Describe your desired customization..."
            className="w-full p-2 border rounded-lg text-sm"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
          />
        </div>

        {/* reCAPTCHA */}
        <div>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
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
