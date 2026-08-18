import React, { useEffect, useState, useCallback } from "react";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Truck,
  Pill,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import api from "../../services/api";
import { format, differenceInDays } from "date-fns";

const TEAL_PALETTE = [
  "#0D9488","#0F766E","#14b8a6","#2dd4bf",
  "#5eead4","#99f6e4","#134e4a","#1e9d89",
];

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  subtext?: string;
}> = ({
  label,
  value,
  icon: Icon,
  iconBg = "bg-teal/10",
  iconColor = "text-[#0D9488]",
  subtext,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const ChartCard: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${className}`}
  >
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-[#0D9488]" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const EmptyChart: React.FC<{ message?: string }> = ({
  message = "No data available yet",
}) => (
  <div className="flex h-[200px] items-center justify-center text-sm text-slate-400 text-center px-4">
    {message}
  </div>
);

const CustomTooltip: React.FC<any> = ({
  active,
  payload,
  label,
  prefix = "",
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      {label && (
        <p className="font-semibold text-slate-600 mb-1">{label}</p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {prefix}
          {typeof p.value === "number"
            ? p.value % 1 === 0
              ? p.value.toLocaleString()
              : p.value.toFixed(2)
            : p.value}
        </p>
      ))}
    </div>
  );
};

const ShopDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [extData, setExtData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Added cache-busting timestamp to prevent stale browser responses
  const fetchAll = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const timestamp = new Date().getTime();
      const [dashRes, extRes] = await Promise.all([
        api.get(`/dashboard/summary?_t=${timestamp}`),
        api.get(`/dashboard/extended?_t=${timestamp}`),
      ]);
      setData(dashRes.data);
      setExtData(extRes.data);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Auto-refresh when user clicks back to Dashboard tab
    const onFocus = () => fetchAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0D9488] border-t-transparent" />
      </div>
    );
  }

  const weeklyData = (data?.weeklyTrend || []).map((d: any) => ({
    name: `${d._id.day}/${d._id.month}`,
    Revenue: Math.round(d.revenue),
  }));

  const categoryData = (data?.categoryDistribution || []).map((c: any) => ({
    name: c._id || "Other",
    value: c.count,
  }));

  const dealerData = (extData?.dealerDistribution || []).map((d: any) => ({
    name: d.dealerName || "Unknown",
    Batches: d.batchCount,
    Value: Math.round(d.totalValue),
  }));

  const monthMedData = (extData?.monthlyMedicinePurchase || []).map(
    (m: any) => ({
      name: MONTH_NAMES[(m._id.month || 1) - 1],
      Quantity: m.totalQuantity,
    })
  );

  const monthSalesData = (extData?.monthlySalesComparison || []).map(
    (m: any) => ({
      name: MONTH_NAMES[(m.month || 1) - 1],
      "This Year": Math.round(m.currentYear || 0),
      "Last Year": Math.round(m.previousYear || 0),
    })
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header with Manual Sync Button ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Today's snapshot and real-time business metrics</p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#0D9488] ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing..." : "Refresh Data"}
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Today's Revenue"
          value={`₹${(data?.todaysSales?.totalRevenue || 0).toFixed(2)}`}
          icon={IndianRupee}
          subtext={`${data?.todaysSales?.billCount || 0} bills today`}
        />
        <MetricCard
          label="Inventory Sale Value"
          value={`₹${(
            (data?.inventoryValue?.totalSaleValue || 0) / 1000
          ).toFixed(1)}k`}
          icon={Boxes}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <MetricCard
          label="Near-Expiry Batches"
          value={data?.expiringBatches?.length || 0}
          icon={AlertTriangle}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtext="Within 90 days"
        />
        <MetricCard
          label="Total Medicines"
          value={data?.totalMedicines || 0}
          icon={Package}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
          subtext={`${data?.expiredCount || 0} dead stock batches`}
        />
      </div>

      {/* ── Row 1: 7-day revenue trend + category pie ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="7-Day Revenue Trend"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={weeklyData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: "#0D9488" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No sales data for the past 7 days" />
          )}
        </ChartCard>

        <ChartCard title="Product Categories" icon={Package}>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_: any, i: number) => (
                    <Cell
                      key={i}
                      fill={TEAL_PALETTE[i % TEAL_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Dealer-wise stock distribution ── */}
      <ChartCard title="Dealer-wise Stock Distribution" icon={Truck}>
        {dealerData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dealerData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) =>
                  v.length > 12 ? v.slice(0, 12) + "…" : v
                }
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                yAxisId="left"
                dataKey="Batches"
                fill="#0D9488"
                radius={[4, 4, 0, 0]}
                name="Batches Supplied"
              />
              <Bar
                yAxisId="right"
                dataKey="Value"
                fill="#2dd4bf"
                radius={[4, 4, 0, 0]}
                name="Stock Value (₹)"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No dealer data yet. Add dealers and link them when adding stock batches to see distribution." />
        )}
      </ChartCard>

      {/* ── Row 3: Month-wise medicine purchase + month-wise sales comparison ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Month-wise Medicine Purchase (Last 6 Months)"
          icon={Pill}
        >
          {monthMedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={monthMedData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Quantity" radius={[4, 4, 0, 0]} name="Units Purchased">
                  {monthMedData.map((_: any, i: number) => (
                    <Cell
                      key={i}
                      fill={TEAL_PALETTE[i % TEAL_PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No medicine purchase data yet. Add stock batches to see monthly trends." />
          )}
        </ChartCard>

        <ChartCard
          title="Month-wise Sales Comparison (This Year vs Last Year)"
          icon={BarChart2}
        >
          {monthSalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={monthSalesData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Legend iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="This Year"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0D9488" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Last Year"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: "#94a3b8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No yearly comparison data yet. Sales data will appear here over time." />
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Near-expiry alerts + low stock ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Near-Expiry Alerts
            </h3>
          </div>
          {data?.expiringBatches?.length > 0 ? (
            <div className="space-y-2">
              {data.expiringBatches.map((b: any) => {
                const daysLeft = differenceInDays(
                  new Date(b.expiryDate),
                  new Date()
                );
                return (
                  <div
                    key={b._id}
                    className="flex items-center justify-between rounded-xl bg-amber-50/60 border border-amber-100 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {b.medicineId?.name || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Batch {b.batchNumber} · {b.quantityRemaining} units ·{" "}
                        {format(new Date(b.expiryDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      {daysLeft}d left
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No near-expiry items — all clear!
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Low Stock Alerts
            </h3>
          </div>
          {data?.lowStockItems?.length > 0 ? (
            <div className="space-y-2">
              {data.lowStockItems.map((m: any) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between rounded-xl bg-rose-50/60 border border-rose-100 px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {m.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Reorder at {m.reorderLevel} units
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 animate-pulse">
                    {m.currentStock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              All medicines above reorder level.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboardPage;
