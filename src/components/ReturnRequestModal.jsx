// src/components/ReturnRequestModal.jsx
import { useState, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

const RETURN_REASONS = [
  "Product not as described",
  "Received wrong item",
  "Product arrived damaged",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

export default function ReturnRequestModal({ open, onClose, order, userId }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // data-url strings
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  if (!open || !order) return null;

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3
    setPhotos(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removePhoto = (idx) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    try {
      // 1. Upload photos to Firebase Storage
      const photoUrls = [];
      for (const file of photos) {
        const path = `returns/${order.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
      }

      // 2. Create return request document
      await addDoc(collection(db, "returnRequests"), {
        orderId: order.id,
        userId,
        reason,
        details: details.trim(),
        photos: photoUrls,
        status: "pending", // pending | approved | rejected
        orderTotal: Number(order.subtotal || 0),
        restockingFee: Number(order.subtotal || 0) * 0.15,
        refundAmount: Number(order.subtotal || 0) * 0.85,
        paymentMethod: order.paymentMethod || "stripe",
        customer: {
          fullName: order.customer?.fullName || "",
          email: order.customer?.email || "",
          phone: order.customer?.phone || "",
        },
        items: (order.items || []).map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          category: item.category,
        })),
        createdAt: serverTimestamp(),
        reviewedAt: null,
        adminNote: "",
      });

      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit return request:", err);
      alert("Failed to submit return request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    setPhotos([]);
    setPreviews([]);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {success ? "Return Request Submitted" : "Request a Return"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Our team will review your return request within 2–3 business days.
              You'll receive an email notification once it's been reviewed.
            </p>
            <button
              onClick={handleClose}
              className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-500">
                Order ID: <span className="font-mono">{order.id}</span>
              </p>
              <p className="text-gray-500">
                Total:{" "}
                <strong>${Number(order.subtotal || 0).toFixed(2)}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                A 15% restocking fee applies. Estimated refund:{" "}
                <strong>
                  ${(Number(order.subtotal || 0) * 0.85).toFixed(2)}
                </strong>
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for return <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional details
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Please describe the issue..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos <span className="text-red-500">*</span> (max 3)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                className="hidden"
                required
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border border-dashed rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full"
              >
                {photos.length > 0
                  ? `${photos.length} photo${photos.length > 1 ? "s" : ""} selected`
                  : "Click to upload photos"}
              </button>
              {previews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={src}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Show error if no photo selected on submit */}
              {submitting && photos.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  Please upload at least one photo.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !reason || photos.length === 0}
              className="w-full bg-red-700 text-white py-2.5 rounded-lg hover:bg-red-800 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
            >
              {submitting ? "Submitting..." : "Submit Return Request"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By submitting, you agree to our{" "}
              <a
                href="/return-policy"
                target="_blank"
                className="text-red-700 hover:underline"
              >
                Return &amp; Refund Policy
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
