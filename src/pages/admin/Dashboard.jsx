import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
  });

  const salesData = [
    { name: "Mon", sales: 200 },
    { name: "Tue", sales: 450 },
    { name: "Wed", sales: 300 },
    { name: "Thu", sales: 600 },
    { name: "Fri", sales: 500 },
    { name: "Sat", sales: 800 },
    { name: "Sun", sales: 400 },
  ];

  useEffect(() => {
    setStats({
      products: 24,
      orders: 12,
      revenue: 1250,
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Total Products</p>
          <h2 className="text-2xl font-bold">{stats.products}</h2>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Orders</p>
          <h2 className="text-2xl font-bold">{stats.orders}</h2>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Revenue</p>
          <h2 className="text-2xl font-bold">
            ${stats.revenue.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Weekly Sales</h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#b91c1c"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
