// src/pages/Contact.jsx
import { FiMail, FiPhone, FiClock, FiMapPin } from "react-icons/fi";

function Contact() {
  return (
    <div className="bg-white text-gray-800">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Reach our support team or find our store locations near you.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-8">
          {/* Customer Support Card */}
          <div className="bg-white border rounded-2xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Customer Support</h2>
              <p className="text-gray-500 text-sm mt-1">
                We’re here to help with your orders, questions, or issues.
              </p>
            </div>

            <div className="border-t">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FiMail className="text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email</p>
                    <p className="text-sm text-gray-500">apsara51@gmail.com</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FiPhone className="text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Phone</p>
                    <p className="text-sm text-gray-500">+855 93866666</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FiClock className="text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Hours</p>
                    <p className="text-sm text-gray-500">Mon–Sun, 9 AM–6 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Locations Card */}
          <div className="bg-white border rounded-2xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Store Locations</h2>
              <p className="text-gray-500 text-sm mt-1">
                Visit us in person at any of our retail locations.
              </p>
            </div>

            <div className="border-t">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phnom Penh */}
                <div className="flex items-start gap-3 rounded-xl border bg-gray-50 p-4">
                  <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                    <FiMapPin className="text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Phnom Penh #1</p>
                    <p className="text-sm text-gray-500">
                      24 Street 53, Daun Penh
                    </p>
                  </div>
                </div>

                {/* Chrouy Chongva */}
                <div className="flex items-start gap-3 rounded-xl border bg-gray-50 p-4">
                  <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                    <FiMapPin className="text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Phnom Penh #2</p>
                    <p className="text-sm text-gray-500">National Street 6A, Chrouy Chongva</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional: small footer note */}
          <p className="text-xs text-gray-400 text-center">
            We usually respond within 24 hours on business days.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
