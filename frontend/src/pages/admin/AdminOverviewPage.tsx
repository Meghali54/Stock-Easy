import React, { useEffect, useState } from "react";
import {
  Building2, Users, DollarSign, ShoppingCart, Clock, CheckCircle, XCircle, TrendingUp,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import MetricCard from "../../components/MetricCard";
import api from "../../services/api";

const PIE_COLORS = ["#0D9488", "#0F766E", "#14b8a6", "#2dd4bf", "#5eead4"];

const AdminOverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/metrics").then(({ data }) => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
      </div>
    );
  }

  const growthData = (metrics?.tenantGrowth || []).map((g: any) => ({
    name: `${g._id.year}-${String(g._id.month).padStart(2, "0")}`,
    Tenants: g.count,
  }));

  const tierData = (metrics?.revenue?.byTier || []).map((t: any) => ({
    name: t._id,
    value: t.count,
    revenue: t.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Tenants"
          value={metrics?.tenants?.total || 0}
          icon={Building2}
          iconBg="bg-teal/10"
          iconColor="text-teal"
          subtext={`${metrics?.tenants?.approved} approved`}
        />
        <MetricCard
          label="Pending Verification"
          value={metrics?.tenants?.pending || 0}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtext="Awaiting review"
        />
        <MetricCard
          label="Monthly Revenue (MRR)"
          value={`₹${((metrics?.revenue?.mrr || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Platform Bills"
          value={metrics?.platformSales?.totalBills?.toLocaleString() || 0}
          icon={ShoppingCart}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          subtext={`₹${((metrics?.platformSales?.totalSales || 0) / 100000).toFixed(2)}L total`}
        />
      </div>

      {/* Verification status pills */}
      <div className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Verification Overview</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Approved", count: metrics?.tenants?.approved, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Pending", count: metrics?.tenants?.pending, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "Rejected", count: metrics?.tenants?.rejected, icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${s.color}`}>
              <s.icon className="h-5 w-5" />
              <div>
                <p className="text-lg font-bold">{s.count}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tenant growth line chart */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Tenant Growth (Last 6 Months)</h3>
          </div>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growthData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="Tenants" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 4, fill: "#0D9488" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              No tenant growth data yet
            </div>
          )}
        </div>

        {/* Subscription tier pie chart */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Subscription Tier Distribution</h3>
          </div>
          {tierData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {tierData.map((_: any, index: number) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              No subscription data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
