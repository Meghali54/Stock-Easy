import React, { useEffect, useState } from "react";
import {
  IndianRupee, ShoppingCart, Package, AlertTriangle, TrendingUp, Boxes,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import MetricCard from "../../components/MetricCard";
import { StatusBadge } from "../../components/Badges";
import api from "../../services/api";
import { format, differenceInDays } from "date-fns";

const CATEGORY_COLORS = [
  "#0D9488","#0F766E","#14b8a6","#2dd4bf","#5eead4","#99f6e4","#134e4a","#1e9d89",
];

const ShopDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/summary").then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex h-60 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
    </div>
  );

  const weeklyData = (data?.weeklyTrend || []).map((d: any) => ({
    name: `${d._id.day}/${d._id.month}`,
    Revenue: d.revenue,
  }));

  const categoryData = (data?.categoryDistribution || []).map((c: any) => ({
    name: c._id,
    value: c.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Today's Revenue"
          value={`₹${(data?.todaysSales?.totalRevenue || 0).toFixed(2)}`}
          icon={IndianRupee}
          subtext={`${data?.todaysSales?.billCount || 0} bills processed`}
        />
        <MetricCard
          label="Inventory Value (Sale)"
          value={`₹${((data?.inventoryValue?.totalSaleValue || 0) / 1000).toFixed(1)}k`}
          icon={Boxes}
          iconBg="bg-violet-100" iconColor="text-violet-600"
        />
        <MetricCard
          label="Near-Expiry Batches"
          value={data?.expiringBatches?.length || 0}
          icon={AlertTriangle}
          iconBg="bg-amber-100" iconColor="text-amber-600"
          subtext="Within 90 days"
        />
        <MetricCard
          label="Total Medicines"
          value={data?.totalMedicines || 0}
          icon={Package}
          iconBg="bg-sky-100" iconColor="text-sky-600"
          subtext={`${data?.expiredCount || 0} dead stock batches`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly revenue trend */}
        <div className="card-surface col-span-2 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">7-Day Revenue Trend</h3>
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [`₹${v.toFixed(2)}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="Revenue" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 4, fill: "#0D9488" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
              No sales data for the past 7 days
            </div>
          )}
        </div>

        {/* Category distribution bar chart */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Product Categories</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
              No category data
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Near-expiry alert table */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-graphite-900">Near-Expiry Alerts</h3>
          </div>
          {data?.expiringBatches?.length > 0 ? (
            <div className="space-y-2">
              {data.expiringBatches.map((b: any) => {
                const daysLeft = differenceInDays(new Date(b.expiryDate), new Date());
                return (
                  <div key={b._id} className="flex items-center justify-between rounded-xl bg-amber-50/60 border border-amber-100 px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-graphite-900">{b.medicineId?.name || "—"}</p>
                      <p className="text-xs text-slate-500">
                        Batch {b.batchNumber} · {b.quantityRemaining} units · Exp: {format(new Date(b.expiryDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    <span className="badge-expiring">{daysLeft}d left</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No near-expiry items — all clear!</p>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-graphite-900">Low Stock Alerts</h3>
          </div>
          {data?.lowStockItems?.length > 0 ? (
            <div className="space-y-2">
              {data.lowStockItems.map((m: any) => (
                <div key={m._id} className="flex items-center justify-between rounded-xl bg-rose-50/60 border border-rose-100 px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-graphite-900">{m.name}</p>
                    <p className="text-xs text-slate-500">Reorder at {m.reorderLevel} units</p>
                  </div>
                  <span className="badge-expired">{m.currentStock} left</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">All medicines above reorder level.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboardPage;
