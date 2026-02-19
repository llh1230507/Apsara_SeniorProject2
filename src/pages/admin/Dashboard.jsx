import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  getDocs,
  getCountFromServer,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAID_STATUSES = new Set(["paid", "processing", "shipped", "completed"]);

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [salesData, setSalesData] = useState(
    DAY_NAMES.map((name) => ({ name, sales: 0 })),
  );

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsSnap, ordersSnap] = await Promise.all([
          getCountFromServer(collection(db, "products")),
          getDocs(
            query(
              collection(db, "orders"),
              orderBy("createdAt", "desc"),
              limit(500),
            ),
          ),
        ]);

        const productCount = productsSnap.data().count;
        const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const paidOrders = orders.filter((o) => PAID_STATUSES.has(o.status));
        const revenue = paidOrders.reduce(
          (sum, o) => sum + Number(o.subtotal || 0),
          0,
        );

        // Build last-7-days chart: group by day-of-week
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyMap = {};
        for (let i = 0; i <= 6; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(sevenDaysAgo.getDate() + i);
          dailyMap[d.toDateString()] = {
            name: DAY_NAMES[d.getDay()],
            sales: 0,
          };
        }

        paidOrders.forEach((o) => {
          if (!o.createdAt) return;
          const d = o.createdAt?.toDate
            ? o.createdAt.toDate()
            : new Date(o.createdAt);
          const key = d.toDateString();
          if (dailyMap[key]) {
            dailyMap[key].sales += Number(o.subtotal || 0);
          }
        });

        setSalesData(Object.values(dailyMap));
        setStats({ products: productCount, orders: orders.length, revenue });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      }
    };

    loadStats();
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
            ${Number(stats.revenue || 0).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue – Last 7 Days</h2>

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
