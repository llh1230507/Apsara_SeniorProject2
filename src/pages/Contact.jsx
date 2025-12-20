function Contact() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-3">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        Reach our support team or find our store locations.
      </p>

      {/* Contact Options */}
      <div className="space-y-8">

        {/* Support Section */}
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-2">Customer Support</h2>
          <p className="text-gray-600 mb-3">We're here to help with your orders, questions, or issues.</p>

          <div className="space-y-1">
            <p><span className="font-medium">Email:</span> support@apsara.com</p>
            <p><span className="font-medium">Phone:</span> +855 123 456</p>
            <p><span className="font-medium">Hours:</span> Mon–Fri, 9 AM–6 PM</p>
          </div>
        </div>

        {/* Store Locations */}
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-2">Store Locations</h2>
          <p className="text-gray-600 mb-4">Visit us at any of our locations.</p>

          <ul className="space-y-3">
            <li>
              <p className="font-medium">Phnom Penh</p>
              <p className="text-gray-600 text-sm">Street 123, Daun Penh</p>
            </li>

            <li>
              <p className="font-medium">Siem Reap</p>
              <p className="text-gray-600 text-sm">Angkor Market Road</p>
            </li>

            <li>
              <p className="font-medium">Battambang</p>
              <p className="text-gray-600 text-sm">Central Market Street</p>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Contact;
