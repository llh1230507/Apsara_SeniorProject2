import { useState } from "react";
import emailjs from "@emailjs/browser";

const QUESTIONS = {
  order: [
    "Where is my order? I haven't received any updates.",
    "I want to cancel my order.",
    "I received a damaged or incorrect item.",
    "I need to change my shipping address.",
    "I have a question about my payment.",
    "Other (see additional message below)",
  ],
  customization: [
    "I'd like an update on the status of my request.",
    "I want to modify the details of my request.",
    "I want to cancel my customization request.",
    "I have a question about the pricing or timeline.",
    "Other (see additional message below)",
  ],
};

export default function ContactSupportModal({
  open,
  onClose,
  type = "order",
  referenceId,
  customerEmail,
  customerName,
}) {
  const [selected, setSelected] = useState("");
  const [extra, setExtra] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const label = type === "order" ? "Order" : "Customization Request";
  const questions = QUESTIONS[type] || QUESTIONS.order;

  const handleClose = () => {
    setSelected("");
    setExtra("");
    setSent(false);
    setError("");
    onClose();
  };

  const handleSend = async () => {
    if (!selected) {
      setError("Please select a question.");
      return;
    }
    setSending(true);
    setError("");

    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const subject = `[${label} Support] ${label} #${referenceId} — Customer Enquiry`;
    const message = [
      `From: ${customerName || "Customer"} (${customerEmail || "—"})`,
      `${label} ID: ${referenceId}`,
      ``,
      `Question: ${selected}`,
      extra ? `\nAdditional message:\n${extra}` : "",
    ]
      .join("\n")
      .trim();

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: "apsarapenhchet51@gmail.com",
          subject,
          message,
        },
        PUBLIC_KEY,
      );
      setSent(true);
    } catch (err) {
      console.error("Support email failed:", err);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {sent ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-lg font-semibold">Message sent!</p>
            <p className="text-sm text-gray-500 mt-1">
              We will get back to you as soon as possible.
            </p>
            <button
              onClick={handleClose}
              className="mt-5 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Contact Support</h2>
                <p className="text-sm text-gray-500">
                  {label} ID:{" "}
                  <span className="font-mono text-xs">{referenceId}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-3">
              What is your question about?
            </p>

            <div className="space-y-2 mb-4">
              {questions.map((q) => (
                <label
                  key={q}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selected === q
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="support-question"
                    value={q}
                    checked={selected === q}
                    onChange={() => {
                      setSelected(q);
                      setError("");
                    }}
                    className="mt-0.5 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">{q}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Additional message (optional)"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 mb-3"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
