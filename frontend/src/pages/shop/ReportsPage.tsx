import React, { useState, useEffect } from "react";
import {
  BarChart2, TrendingUp, IndianRupee, Receipt,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import MetricCard from "../../components/MetricCard";
import api from "../../services/api";
import { format, subDays } from "date-fns";

const PIE_COLORS = ["#0D9488", "#0F766E", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];

const ReportsPage: React.FC = () => {
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/reports/sales?from=${from}&to=${to}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const dailyTrendData = (data?.dailyTrend || []).map((d: any) => ({
    name: `${d._id.day}/${d._id.month}`,
    Revenue: d.revenue,
    Tax: d.tax,
    Bills: d.bills,
  }));

  const topMedsData = (data?.topMedicines || []).slice(0, 8);

  const paymentData = (data?.paymentBreakdown || []).map((p: any) => ({
    name: p._id,
    value: p.count,
    total: p.total,
  }));

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div>
          <label className="label-field">From</label>
          <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label-field">To</label>
          <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={fetchReport} disabled={loading} className="btn-primary gap-2">
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <BarChart2 className="h-4 w-4" />
          )}
          Generate Report
        </button>

        {/* Quick presets */}
        <div className="flex gap-2 sm:ml-auto">
          {[
            { label: "7 Days", days: 6 },
            { label: "30 Days", days: 29 },
            { label: "90 Days", days: 89 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(format(subDays(new Date(), p.days), "yyyy-MM-dd"));
                setTo(format(new Date(), "yyyy-MM-dd"));
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total Revenue"
            value={`₹${(data.totals.totalRevenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={IndianRupee}
          />
          <MetricCard
            label="Total Bills"
            value={data.totals.totalBills || 0}
            icon={Receipt}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
          <MetricCard
            label="Total Tax Collected"
            value={`₹${(data.totals.totalTax || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            iconBg="bg-sky-100"
            iconColor="text-sky-600"
          />
          <MetricCard
            label="Total Discounts"
            value={`₹${(data.totals.totalDiscount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={BarChart2}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Daily revenue line chart */}
      <div className="card-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-semibold text-graphite-900">Daily Revenue Trend</h3>
        </div>
        {dailyTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number, name: string) =>
                  name === "Bills" ? [v, "Bills"] : [`₹${v.toFixed(2)}`, name]
                }
              />
              <Line type="monotone" dataKey="Revenue" stroke="#0D9488" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Tax" stroke="#14b8a6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
            No sales data for this period
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top medicines bar chart */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Top 8 Medicines by Units Sold</h3>
          </div>
          {topMedsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topMedsData} layout="vertical" margin={{ left: 10, right: 15 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={90}
                  tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number, name: string) => [
                    name === "totalQuantity" ? `${v} units` : `₹${v.toFixed(2)}`,
                    name === "totalQuantity" ? "Units Sold" : "Revenue",
                  ]}
                />
                <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
                  {topMedsData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Payment mode pie chart */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Payment Mode Distribution</h3>
          </div>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number, _: string, props: any) => [
                    `${v} bills · ₹${props.payload.total?.toFixed(2)}`,
                    props.payload.name,
                  ]}
                />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
              No payment data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
