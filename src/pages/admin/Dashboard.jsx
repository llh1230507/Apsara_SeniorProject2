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

const PAID_STATUSES = new Set(["paid", "processing", "shipped", "completed"]);

function getDateRangeStart(period) {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setDate(now.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // year: last 12 months
  const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildChartData(paidOrders, period) {
  const now = new Date();

  if (period === "week") {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      map[d.toDateString()] = {
        name: d.toLocaleDateString("en", { weekday: "short", day: "numeric" }),
        sales: 0,
      };
    }
    paidOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = o.createdAt?.toDate
        ? o.createdAt.toDate()
        : new Date(o.createdAt);
      const k = d.toDateString();
      if (map[k]) map[k].sales += Number(o.subtotal || 0);
    });
    return Object.values(map);
  }

  if (period === "month") {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      map[d.toDateString()] = {
        name: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        sales: 0,
      };
    }
    paidOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = o.createdAt?.toDate
        ? o.createdAt.toDate()
        : new Date(o.createdAt);
      const k = d.toDateString();
      if (map[k]) map[k].sales += Number(o.subtotal || 0);
    });
    return Object.values(map);
  }

  // year: last 12 months
  const map = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = {
      name: d.toLocaleDateString("en", { month: "short", year: "2-digit" }),
      sales: 0,
    };
  }
  paidOrders.forEach((o) => {
    if (!o.createdAt) return;
    const d = o.createdAt?.toDate
      ? o.createdAt.toDate()
      : new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (map[key]) map[key].sales += Number(o.subtotal || 0);
  });
  return Object.values(map);
}

const PERIOD_LABELS = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

const CHART_TITLES = {
  week: "Last 7 Days",
  month: "Last 30 Days",
  year: "Last 12 Months",
};

function Dashboard() {
  const [period, setPeriod] = useState("week");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product list for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "products"), orderBy("name")),
        );
        setProducts(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id })),
        );
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Load stats whenever period or product filter changes
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
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
        let orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter by time period
        const startDate = getDateRangeStart(period);
        orders = orders.filter((o) => {
          if (!o.createdAt) return false;
          const d = o.createdAt?.toDate
            ? o.createdAt.toDate()
            : new Date(o.createdAt);
          return d >= startDate;
        });

        // Filter by product
        if (selectedProduct) {
          orders = orders.filter(
            (o) =>
              Array.isArray(o.items) &&
              o.items.some((item) => item.id === selectedProduct),
          );
        }

        const paidOrders = orders.filter((o) => PAID_STATUSES.has(o.status));
        const revenue = paidOrders.reduce(
          (sum, o) => sum + Number(o.subtotal || 0),
          0,
        );

        setSalesData(buildChartData(paidOrders, period));
        setStats({ products: productCount, orders: orders.length, revenue });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [period, selectedProduct]);

  const activeProductName = selectedProduct
    ? products.find((p) => p.id === selectedProduct)?.name
    : null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Period buttons */}
        <div className="flex rounded-lg border overflow-hidden">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                period === key
                  ? "bg-red-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Product dropdown */}
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-[180px]"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {selectedProduct && (
          <button
            onClick={() => setSelectedProduct("")}
            className="text-sm text-red-700 hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500 text-sm">Total Products</p>
          <h2 className="text-2xl font-bold mt-1">{stats.products}</h2>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500 text-sm">
            Orders
            <span className="ml-1 text-xs text-gray-400">
              ({PERIOD_LABELS[period]}
              {activeProductName ? ` · ${activeProductName}` : ""})
            </span>
          </p>
          <h2 className="text-2xl font-bold mt-1">{stats.orders}</h2>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500 text-sm">
            Revenue
            <span className="ml-1 text-xs text-gray-400">
              ({PERIOD_LABELS[period]}
              {activeProductName ? ` · ${activeProductName}` : ""})
            </span>
          </p>
          <h2 className="text-2xl font-bold mt-1">
            ${Number(stats.revenue || 0).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-1">
          Revenue — {CHART_TITLES[period]}
        </h2>
        {activeProductName && (
          <p className="text-sm text-gray-500 mb-4">
            Filtered by:{" "}
            <span className="font-medium">{activeProductName}</span>
          </p>
        )}

        {loading ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={period === "month" ? 4 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [
                    `$${Number(v).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#b91c1c"
                  strokeWidth={3}
                  dot={period !== "month"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
