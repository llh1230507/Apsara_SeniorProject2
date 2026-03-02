// src/pages/ReturnPolicy.jsx
import { NavLink } from "react-router-dom";

export default function ReturnPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 pt-24">
      <h1 className="text-3xl font-bold mb-2">Return &amp; Refund Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: February 2026</p>

      <div className="bg-white rounded-xl shadow p-8 space-y-8 text-gray-700 leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            1. Return Eligibility
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You may request a return within <strong>7 days</strong> of
              receiving your order.
            </li>
            <li>
              The product must be in its <strong>original condition</strong>,
              unused, and in its original packaging.
            </li>
            <li>
              Returns are only available for orders marked as{" "}
              <strong>"Delivered"</strong>.
            </li>
            <li>
              If the product is damage within the 7 day period, the refund amount will be based on the serverity of the damage.
            </li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            2. Non-Returnable Items
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Items returned after the 7-day window.</li>
            <li>Products that are damaged non-repairable after the 7-day window.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            3. Restocking Fee
          </h2>
          <p>
            A <strong>15% restocking fee</strong> will be deducted from your
            refund amount to cover handling, inspection, and repackaging costs.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            4. How to Request a Return
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Go to{" "}
              <NavLink
                to="/orders"
                className="text-red-700 hover:underline font-medium"
              >
                My Orders
              </NavLink>
              .
            </li>
            <li>
              Find the delivered order and click{" "}
              <strong>"Request Return"</strong>.
            </li>
            <li>Select a reason, add optional photos, and submit.</li>
            <li>
              Our team will review your request within{" "}
              <strong>2–3 business days</strong>.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            5. Refund Process
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Card payments:</strong> Refund will be processed back to
              your original payment method within 5–10 business days.
            </li>
            <li>
              <strong>Cash on Delivery:</strong> Refund will be arranged via
              bank transfer. Our team will contact you for details.
            </li>
            <li>Shipping fees are non-refundable.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            6. Damaged or Defective Products
          </h2>
          <p>
            If you receive a damaged or defective product, please contact us
            immediately. We will arrange a replacement or full refund at no
            additional cost. Please include photos of the damage with your
            return request.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            7. Contact Us
          </h2>
          <p>
            Have questions about our return policy? Feel free to{" "}
            <NavLink
              to="/contact"
              className="text-red-700 hover:underline font-medium"
            >
              contact us
            </NavLink>{" "}
            and our support team will be happy to help.
          </p>
        </section>
      </div>
    </div>
  );
}
