import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-red-700">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, the page you are looking for isn't available.
        <br />
        Please check the URL or return to the homepage.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
      >
        Go to Homepage
      </a>
    </div>
  );
}
