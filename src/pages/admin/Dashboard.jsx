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

// ── Rolling-window helpers ────────────────────────────────────────────────────
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

// ── Custom date-range helpers ─────────────────────────────────────────────────
function getCustomRange(type, value) {
  if (!value) return null;
  if (type === "day") {
    const [y, m, d] = value.split("-").map(Number);
    return {
      start: new Date(y, m - 1, d, 0, 0, 0, 0),
      end:   new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  }
  if (type === "week") {
    // value = "YYYY-Www"
    const [yearStr, wPart] = value.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(wPart, 10);
    const jan4 = new Date(year, 0, 4);
    const startOfW1 = new Date(jan4);
    startOfW1.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1));
    const start = new Date(startOfW1);
    start.setDate(startOfW1.getDate() + (week - 1) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (type === "month") {
    // value = "YYYY-MM"
    const [y, m] = value.split("-").map(Number);
    return {
      start: new Date(y, m - 1, 1, 0, 0, 0, 0),
      end:   new Date(y, m, 0, 23, 59, 59, 999),
    };
  }
  if (type === "year") {
    const y = parseInt(value, 10);
    return {
      start: new Date(y, 0, 1, 0, 0, 0, 0),
      end:   new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }
  return null;
}

function getCustomTitle(type, value) {
  if (!value) return "Custom";
  if (type === "day") {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en", {
      year: "numeric", month: "long", day: "numeric",
    });
  }
  if (type === "week") {
    const [yr, wPart] = value.split("-W");
    return `Week ${wPart}, ${yr}`;
  }
  if (type === "month") {
    const [y, m] = value.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en", {
      year: "numeric", month: "long",
    });
  }
  if (type === "year") return `Year ${value}`;
  return value;
}

// Returns the current ISO week string e.g. "2025-W08"
function getCurrentWeek() {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1));
  const diffMs = now - startOfW1;
  const week = Math.floor(diffMs / (7 * 24 * 3600 * 1000)) + 1;
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function defaultValueForType(type) {
  const now = new Date();
  if (type === "day")
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (type === "week") return getCurrentWeek();
  if (type === "month")
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (type === "year") return String(now.getFullYear());
  return "";
}

function getYearOptions() {
  const curr = new Date().getFullYear();
  const years = [];
  for (let y = curr; y >= 2020; y--) years.push(y);
  return years;
}

// ── Chart builder ─────────────────────────────────────────────────────────────
function buildChartData(paidOrders, period, customType, customValue) {
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
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
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
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const k = d.toDateString();
      if (map[k]) map[k].sales += Number(o.subtotal || 0);
    });
    return Object.values(map);
  }

  if (period === "year") {
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
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map[key]) map[key].sales += Number(o.subtotal || 0);
    });
    return Object.values(map);
  }

  // ── custom ──
  if (period === "custom" && customValue) {
    if (customType === "day") {
      const map = {};
      for (let h = 0; h < 24; h++) {
        map[h] = { name: `${h}:00`, sales: 0 };
      }
      paidOrders.forEach((o) => {
        if (!o.createdAt) return;
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        map[d.getHours()].sales += Number(o.subtotal || 0);
      });
      return Object.values(map);
    }

    if (customType === "week") {
      const range = getCustomRange("week", customValue);
      if (!range) return [];
      const map = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(range.start);
        d.setDate(range.start.getDate() + i);
        map[d.toDateString()] = {
          name: d.toLocaleDateString("en", { weekday: "short", day: "numeric" }),
          sales: 0,
        };
      }
      paidOrders.forEach((o) => {
        if (!o.createdAt) return;
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        const k = d.toDateString();
        if (map[k]) map[k].sales += Number(o.subtotal || 0);
      });
      return Object.values(map);
    }

    if (customType === "month") {
      const [y, m] = customValue.split("-").map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const map = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(y, m - 1, day);
        map[d.toDateString()] = {
          name: d.toLocaleDateString("en", { day: "numeric", month: "short" }),
          sales: 0,
        };
      }
      paidOrders.forEach((o) => {
        if (!o.createdAt) return;
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        const k = d.toDateString();
        if (map[k]) map[k].sales += Number(o.subtotal || 0);
      });
      return Object.values(map);
    }

    if (customType === "year") {
      const y = parseInt(customValue, 10);
      const map = {};
      for (let mo = 0; mo < 12; mo++) {
        const d = new Date(y, mo, 1);
        const key = `${y}-${mo}`;
        map[key] = {
          name: d.toLocaleDateString("en", { month: "short" }),
          sales: 0,
        };
      }
      paidOrders.forEach((o) => {
        if (!o.createdAt) return;
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (d.getFullYear() !== y) return;
        const key = `${y}-${d.getMonth()}`;
        if (map[key]) map[key].sales += Number(o.subtotal || 0);
      });
      return Object.values(map);
    }
  }

  return [];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PERIOD_LABELS = {
  week:   "This Week",
  month:  "This Month",
  year:   "This Year",
  custom: "Custom",
};

const CHART_TITLES = {
  week:  "Last 7 Days",
  month: "Last 30 Days",
  year:  "Last 12 Months",
};

const CUSTOM_TYPE_OPTIONS = [
  { value: "day",   label: "Day" },
  { value: "week",  label: "Week" },
  { value: "month", label: "Month" },
  { value: "year",  label: "Year" },
];

// ── Component ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [period, setPeriod] = useState("week");
  const [customType, setCustomType] = useState("month");
  const [customValue, setCustomValue] = useState(defaultValueForType("month"));
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

  // Load stats whenever filters change
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
        if (period === "custom" && customValue) {
          const range = getCustomRange(customType, customValue);
          if (range) {
            orders = orders.filter((o) => {
              if (!o.createdAt) return false;
              const d = o.createdAt?.toDate
                ? o.createdAt.toDate()
                : new Date(o.createdAt);
              return d >= range.start && d <= range.end;
            });
          }
        } else if (period !== "custom") {
          const startDate = getDateRangeStart(period);
          orders = orders.filter((o) => {
            if (!o.createdAt) return false;
            const d = o.createdAt?.toDate
              ? o.createdAt.toDate()
              : new Date(o.createdAt);
            return d >= startDate;
          });
        }

        // Filter by product
        if (selectedProduct) {
          orders = orders.filter(
            (o) =>
              Array.isArray(o.items) &&
              o.items.some((item) => item.id === selectedProduct),
          );
        }

        const paidOrders = orders.filter((o) => {
          // COD orders are only paid when delivered on site
          if (o.paymentMethod === "cod") return o.status === "completed";
          return PAID_STATUSES.has(o.status);
        });
        const revenue = paidOrders.reduce(
          (sum, o) => sum + Number(o.subtotal || 0),
          0,
        );

        setSalesData(buildChartData(paidOrders, period, customType, customValue));
        setStats({ products: productCount, orders: orders.length, revenue });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [period, selectedProduct, customType, customValue]);

  const activeProductName = selectedProduct
    ? products.find((p) => p.id === selectedProduct)?.name
    : null;

  const chartTitle =
    period === "custom"
      ? getCustomTitle(customType, customValue)
      : CHART_TITLES[period];

  const periodLabel =
    period === "custom"
      ? getCustomTitle(customType, customValue)
      : PERIOD_LABELS[period];

  // When switching custom type, reset value to the right default
  const handleCustomTypeChange = (type) => {
    setCustomType(type);
    setCustomValue(defaultValueForType(type));
  };

  // XAxis tick interval for chart
  const xAxisInterval = (() => {
    if (period === "month") return 4;
    if (period === "custom" && customType === "month") return 4;
    if (period === "custom" && customType === "day") return 3;
    return 0;
  })();

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

        {/* Custom date controls */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="flex rounded-lg border overflow-hidden">
              {CUSTOM_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCustomTypeChange(opt.value)}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    customType === opt.value
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Value picker */}
            {customType === "year" ? (
              <select
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                {getYearOptions().map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            ) : customType === "month" ? (
              <input
                type="month"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              />
            ) : customType === "week" ? (
              <input
                type="week"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              />
            ) : (
              <input
                type="date"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              />
            )}
          </div>
        )}

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
              ({periodLabel}
              {activeProductName ? ` · ${activeProductName}` : ""})
            </span>
          </p>
          <h2 className="text-2xl font-bold mt-1">{stats.orders}</h2>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500 text-sm">
            Revenue
            <span className="ml-1 text-xs text-gray-400">
              ({periodLabel}
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
          Revenue — {chartTitle}
        </h2>
        {activeProductName && (
          <p className="text-sm text-gray-500 mb-4">
            Filtered by: <span className="font-medium">{activeProductName}</span>
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
                  interval={xAxisInterval}
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
                  dot={period !== "month" && !(period === "custom" && customType === "month")}
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
