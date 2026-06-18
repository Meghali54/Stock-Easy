import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Loader2 } from "lucide-react";
import api from "../../services/api";
import { TierBadge } from "../../components/Badges";
import MetricCard from "../../components/MetricCard";

const TIER_PRICES: Record<string, number> = { Trial: 0, Basic: 999, Pro: 2499, Enterprise: 4999 };

const SubscriptionsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/metrics"),
      api.get("/admin/shops?status=Approved"),
    ]).then(([m, s]) => {
      setMetrics(m.data);
      setShops(s.data);
      setLoading(false);
    });
  }, []);

  const updateTier = async (shopId: string, tier: string) => {
    setUpdating(shopId);
    try {
      await api.patch(`/admin/shops/${shopId}/subscription`, {
        subscriptionTier: tier,
        subscriptionRevenue: TIER_PRICES[tier] || 0,
      });
      setShops((prev) =>
        prev.map((s) => s._id === shopId ? { ...s, subscriptionTier: tier, subscriptionRevenue: TIER_PRICES[tier] } : s)
      );
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal border-t-transparent" />
    </div>
  );

  const tierBreakdown = metrics?.revenue?.byTier || [];
  const mrr = metrics?.revenue?.mrr || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Monthly Recurring Revenue" value={`₹${mrr.toLocaleString()}`} icon={DollarSign} />
        <MetricCard label="Active Paid Tenants"
          value={shops.filter((s) => s.subscriptionTier !== "Trial").length}
          icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <MetricCard label="Trial Tenants"
          value={shops.filter((s) => s.subscriptionTier === "Trial").length}
          icon={DollarSign} iconBg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      {/* Tier breakdown cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {["Trial", "Basic", "Pro", "Enterprise"].map((tier) => {
          const found = tierBreakdown.find((t: any) => t._id === tier);
          return (
            <div key={tier} className="card-surface p-4">
              <TierBadge tier={tier} />
              <p className="mt-3 text-2xl font-bold text-graphite-900">{found?.count || 0}</p>
              <p className="text-xs text-slate-400">tenants</p>
              <p className="mt-1 text-sm font-semibold text-teal">₹{(found?.revenue || 0).toLocaleString()}/mo</p>
            </div>
          );
        })}
      </div>

      {/* Shops table with tier editor */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Tenants — Manage Tiers</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 text-left">Shop</th>
              <th className="px-5 py-3 text-left">Current Tier</th>
              <th className="px-5 py-3 text-left">MRR Contribution</th>
              <th className="px-5 py-3 text-left">Change Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shops.map((shop) => (
              <tr key={shop._id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-graphite-900">{shop.name}</p>
                  <p className="text-xs text-slate-400">{shop.email}</p>
                </td>
                <td className="px-5 py-3.5"><TierBadge tier={shop.subscriptionTier} /></td>
                <td className="px-5 py-3.5 font-semibold text-teal">
                  ₹{(shop.subscriptionRevenue || 0).toLocaleString()}/mo
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <select
                      className="input-field !py-1.5 !text-xs w-32"
                      value={shop.subscriptionTier}
                      onChange={(e) => updateTier(shop._id, e.target.value)}
                      disabled={updating === shop._id}
                    >
                      {Object.keys(TIER_PRICES).map((t) => <option key={t}>{t}</option>)}
                    </select>
                    {updating === shop._id && <Loader2 className="h-4 w-4 animate-spin text-teal" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
