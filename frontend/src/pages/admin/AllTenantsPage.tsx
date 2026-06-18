import React, { useEffect, useState } from "react";
import { Search, Building2 } from "lucide-react";
import api from "../../services/api";
import { VerificationBadge, TierBadge } from "../../components/Badges";
import { format } from "date-fns";

const STATUS_TABS = ["All", "Approved", "Pending", "Rejected"];

const AllTenantsPage: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const fetchShops = async (status: string) => {
    setLoading(true);
    const params = status !== "All" ? `?status=${status}` : "";
    const { data } = await api.get(`/admin/shops${params}`);
    setShops(data);
    setLoading(false);
  };

  useEffect(() => { fetchShops(activeTab); }, [activeTab]);

  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab ? "bg-graphite-900 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input-field pl-9 !py-2 !text-xs w-64"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 text-left">Shop</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Owner</th>
              <th className="px-5 py-3 text-left hidden lg:table-cell">GSTIN</th>
              <th className="px-5 py-3 text-left">Tier</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No shops found
                </td>
              </tr>
            ) : (
              filtered.map((shop) => (
                <tr key={shop._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
                        {shop.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-graphite-900">{shop.name}</p>
                        <p className="text-xs text-slate-400">{shop.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{shop.ownerName}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 hidden lg:table-cell">{shop.gstin}</td>
                  <td className="px-5 py-3.5"><TierBadge tier={shop.subscriptionTier} /></td>
                  <td className="px-5 py-3.5"><VerificationBadge status={shop.verificationStatus} /></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 hidden sm:table-cell">
                    {format(new Date(shop.createdAt), "dd MMM yyyy")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-right">Showing {filtered.length} of {shops.length} tenants</p>
    </div>
  );
};

export default AllTenantsPage;
