import { useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      customer: "John Doe",
      total: 120,
      status: "Pending",
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      total: 250,
      status: "Completed",
    },
  ]);

  const updateStatus = (id, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3">{order.id}</td>
                <td className="p-3">{order.customer}</td>
                <td className="p-3">${order.total}</td>

                <td className="p-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value)
                    }
                    className={`px-3 py-1 rounded text-sm
                      ${
                        order.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    <option>Pending</option>
                    <option>Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;
