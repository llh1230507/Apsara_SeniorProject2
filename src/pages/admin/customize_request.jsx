import { useEffect, useState } from "react";

const MOCK_REQUESTS = [
  {
    id: 101,
    guestName: "Alice Nguyen",
    email: "alice@example.com",
    phone: "555-1234",
    details: "Custom coffee table made of walnut wood, 120x60cm.",
    createdAt: "2025-12-01T10:30:00Z",
    status: "pending",
  },
  {
    id: 102,
    guestName: "Ben Carter",
    email: "ben@example.com",
    phone: "555-9876",
    details: "Metal bookshelf (black steel), 6 shelves, 2m tall.",
    createdAt: "2025-12-02T08:15:00Z",
    status: "pending",
  },
];

export default function Customize_Request() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  useEffect(() => {
    setTimeout(() => {
      setRequests(MOCK_REQUESTS);
      setLoading(false);
    }, 500);
  }, []);

  const updateStatus = (id, status) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setTimeout(() => {
      setRequests((list) =>
        list.map((r) => (r.id === id ? { ...r, status } : r))
      );
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }, 600);
  };

  const statusBadge = (status = "pending") => {
    const styles = {
      pending: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Customization Requests</h2>
        <span className="text-sm text-gray-500">
          Total: {requests.length}
        </span>
      </div>

      {loading && <p className="text-gray-500">Loading requests...</p>}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="py-3 text-left">Guest</th>
                <th className="py-3 text-left">Contact</th>
                <th className="py-3 text-left">Request</th>
                <th className="py-3 text-left">Date</th>
                <th className="py-3 text-left">Status</th>
                <th className="py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => {
                const pending = r.status === "pending";
                const isBusy = busy[r.id];

                return (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3">
                      <div className="font-semibold">{r.guestName}</div>
                      <div className="text-xs text-gray-400">#{r.id}</div>
                    </td>

                    <td className="py-3 text-sm">
                      <div>{r.email}</div>
                      <div className="text-gray-400">{r.phone}</div>
                    </td>

                    <td className="py-3 text-sm max-w-sm">
                      {r.details}
                    </td>

                    <td className="py-3 text-sm">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3">{statusBadge(r.status)}</td>

                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={!pending || isBusy}
                          onClick={() => updateStatus(r.id, "accepted")}
                          className={`px-3 py-1 rounded text-sm font-semibold
                            ${
                              pending && !isBusy
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          {isBusy ? "..." : "Accept"}
                        </button>

                        <button
                          disabled={!pending || isBusy}
                          onClick={() => updateStatus(r.id, "rejected")}
                          className={`px-3 py-1 rounded text-sm font-semibold
                            ${
                              pending && !isBusy
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          {isBusy ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
