import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Package, Plus, X, Loader2 } from "lucide-react";
import api from "../../services/api";
import { StatusBadge } from "../../components/Badges";
import { format } from "date-fns";

type FilterTab = "all" | "expiring" | "out_of_stock" | "dead_stock";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Stock" },
  { key: "expiring", label: "Expiring Soon" },
  { key: "out_of_stock", label: "Out of Stock" },
  { key: "dead_stock", label: "Dead Stock" },
];

interface Medicine { _id: string; name: string; category: string; unit: string; }
interface Dealer { _id: string; name: string; }

const InventoryLedgerPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [addForm, setAddForm] = useState({
    medicineId: "", dealerId: "", batchNumber: "", expiryDate: "",
    manufactureDate: "", quantityReceived: 0, purchasePrice: 0, sellingPrice: 0, mrp: 0,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchBatches = useCallback(async (tab: FilterTab) => {
    setLoading(true);
    const [batchRes, summaryRes] = await Promise.all([
      api.get(`/batches?filter=${tab}`),
      api.get("/batches/summary"),
    ]);
    setBatches(batchRes.data);
    setSummary(summaryRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBatches(activeTab); }, [activeTab, fetchBatches]);

  const openAddModal = async () => {
    const [medRes, dealerRes] = await Promise.all([api.get("/medicines"), api.get("/dealers")]);
    setMedicines(medRes.data);
    setDealers(dealerRes.data);
    setShowAddModal(true);
  };

  const handleAddBatch = async () => {
    setAddError("");
    setAddLoading(true);
    try {
      await api.post("/batches", addForm);
      setShowAddModal(false);
      fetchBatches(activeTab);
      setAddForm({ medicineId: "", dealerId: "", batchNumber: "", expiryDate: "", manufactureDate: "", quantityReceived: 0, purchasePrice: 0, sellingPrice: 0, mrp: 0 });
    } catch (err: any) {
      setAddError(err?.response?.data?.message || "Failed to add batch");
    } finally {
      setAddLoading(false);
    }
  };

  const setField = (k: string, v: any) => setAddForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.key ? "bg-graphite-900 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.key === "all" ? summary.all : tab.key === "expiring" ? summary.expiring : tab.key === "out_of_stock" ? summary.outOfStock : summary.deadStock}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => fetchBatches(activeTab)} className="btn-secondary gap-2 !py-2 !text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={openAddModal} className="btn-primary gap-2 !py-2 !text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Batch / GRN
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 text-left">Medicine</th>
              <th className="px-5 py-3 text-left">Batch #</th>
              <th className="px-5 py-3 text-left">Expiry</th>
              <th className="px-5 py-3 text-right">Remaining</th>
              <th className="px-5 py-3 text-right">Purchase ₹</th>
              <th className="px-5 py-3 text-right">Selling ₹</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No batches in this category
                </td>
              </tr>
            ) : (
              batches.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 transition-colors animate-fade-in">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-graphite-900">{b.medicineId?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{b.medicineId?.category}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{b.batchNumber}</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {b.expiryDate ? format(new Date(b.expiryDate), "MMM yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-graphite-900">
                    {b.quantityRemaining}
                    <span className="ml-1 text-xs font-normal text-slate-400">{b.medicineId?.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">₹{b.purchasePrice?.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-teal">₹{b.sellingPrice?.toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-graphite-900">Add New Batch / GRN Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label-field">Medicine *</label>
                <select className="input-field" value={addForm.medicineId} onChange={(e) => setField("medicineId", e.target.value)}>
                  <option value="">Select medicine…</option>
                  {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Supplier / Dealer</label>
                <select className="input-field" value={addForm.dealerId} onChange={(e) => setField("dealerId", e.target.value)}>
                  <option value="">None</option>
                  {dealers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Batch Number *</label>
                  <input className="input-field" value={addForm.batchNumber} onChange={(e) => setField("batchNumber", e.target.value)} placeholder="B-2025-001" />
                </div>
                <div>
                  <label className="label-field">Expiry Date *</label>
                  <input type="date" className="input-field" value={addForm.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} />
                </div>
                <div>
                  <label className="label-field">Qty Received *</label>
                  <input type="number" className="input-field" value={addForm.quantityReceived || ""} onChange={(e) => setField("quantityReceived", Number(e.target.value))} />
                </div>
                <div>
                  <label className="label-field">Purchase Price (₹) *</label>
                  <input type="number" className="input-field" value={addForm.purchasePrice || ""} onChange={(e) => setField("purchasePrice", Number(e.target.value))} />
                </div>
                <div>
                  <label className="label-field">Selling Price (₹) *</label>
                  <input type="number" className="input-field" value={addForm.sellingPrice || ""} onChange={(e) => setField("sellingPrice", Number(e.target.value))} />
                </div>
                <div>
                  <label className="label-field">MRP (₹)</label>
                  <input type="number" className="input-field" value={addForm.mrp || ""} onChange={(e) => setField("mrp", Number(e.target.value))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddBatch}
                  disabled={addLoading || !addForm.medicineId || !addForm.batchNumber || !addForm.expiryDate || !addForm.quantityReceived || !addForm.purchasePrice || !addForm.sellingPrice}
                  className="btn-primary flex-1"
                >
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Add Batch"}
                </button>
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryLedgerPage;
