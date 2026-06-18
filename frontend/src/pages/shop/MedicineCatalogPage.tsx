import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pill, Edit2, X, Loader2, CheckCircle } from "lucide-react";
import api from "../../services/api";

const CATEGORIES = ["Tablet","Capsule","Syrup","Injection","Ointment","Drops","Inhaler","Device","Other"];
const SCHEDULES = ["OTC","H","H1","X","G"];
const GST_RATES = [0, 5, 12, 18];

const BLANK = { name:"", genericName:"", manufacturer:"", category:"Tablet", hsnCode:"", gstRate:12, schedule:"OTC", unit:"strip", reorderLevel:10 };

const MedicineCatalogPage: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [form, setForm] = useState<any>({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/medicines");
    setMedicines(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ ...BLANK }); setEditId(null); setError(""); setModal("add"); };
  const openEdit = (m: any) => {
    setForm({ name: m.name, genericName: m.genericName, manufacturer: m.manufacturer, category: m.category, hsnCode: m.hsnCode, gstRate: m.gstRate, schedule: m.schedule, unit: m.unit, reorderLevel: m.reorderLevel });
    setEditId(m._id);
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    setError(""); setSaving(true);
    try {
      if (modal === "add") {
        await api.post("/medicines", form);
      } else {
        await api.put(`/medicines/${editId}`, form);
      }
      setModal(null);
      fetch();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this medicine?")) return;
    await api.delete(`/medicines/${id}`);
    fetch();
  };

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="input-field pl-10 w-64 !text-xs !py-2" placeholder="Search medicines…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={openAdd} className="btn-primary gap-2 !py-2 !text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Medicine
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 text-left">Medicine</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Category</th>
              <th className="px-5 py-3 text-left hidden lg:table-cell">Schedule</th>
              <th className="px-5 py-3 text-right hidden md:table-cell">In Stock</th>
              <th className="px-5 py-3 text-right hidden lg:table-cell">GST</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-teal border-t-transparent mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                <Pill className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                No medicines found
              </td></tr>
            ) : filtered.map((m) => (
              <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-graphite-900">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.genericName || "—"} · {m.manufacturer || "—"}</p>
                </td>
                <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{m.category}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.schedule === "OTC" ? "bg-slate-100 text-slate-600" : m.schedule === "H" || m.schedule === "H1" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                    {m.schedule}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right hidden md:table-cell">
                  <span className={`font-bold ${m.totalRemaining <= m.reorderLevel ? "text-rose-600" : "text-graphite-900"}`}>
                    {m.totalRemaining}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">{m.unit}s</span>
                </td>
                <td className="px-5 py-3.5 text-right text-slate-500 hidden lg:table-cell">{m.gstRate}%</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(m)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-teal hover:text-teal">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeactivate(m._id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-graphite-900">{modal === "add" ? "Add Medicine" : "Edit Medicine"}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label-field">Medicine Name *</label>
                  <input className="input-field" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Paracetamol 500mg" />
                </div>
                <div>
                  <label className="label-field">Generic Name</label>
                  <input className="input-field" value={form.genericName} onChange={(e) => setField("genericName", e.target.value)} placeholder="Paracetamol" />
                </div>
                <div>
                  <label className="label-field">Manufacturer</label>
                  <input className="input-field" value={form.manufacturer} onChange={(e) => setField("manufacturer", e.target.value)} placeholder="Cipla" />
                </div>
                <div>
                  <label className="label-field">Category</label>
                  <select className="input-field" value={form.category} onChange={(e) => setField("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Drug Schedule</label>
                  <select className="input-field" value={form.schedule} onChange={(e) => setField("schedule", e.target.value)}>
                    {SCHEDULES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">GST Rate (%)</label>
                  <select className="input-field" value={form.gstRate} onChange={(e) => setField("gstRate", Number(e.target.value))}>
                    {GST_RATES.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Unit</label>
                  <input className="input-field" value={form.unit} onChange={(e) => setField("unit", e.target.value)} placeholder="strip" />
                </div>
                <div>
                  <label className="label-field">HSN Code</label>
                  <input className="input-field" value={form.hsnCode} onChange={(e) => setField("hsnCode", e.target.value)} placeholder="30049099" />
                </div>
                <div>
                  <label className="label-field">Reorder Level</label>
                  <input type="number" className="input-field" value={form.reorderLevel} onChange={(e) => setField("reorderLevel", Number(e.target.value))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex-1 gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {modal === "add" ? "Add Medicine" : "Save Changes"}
                </button>
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineCatalogPage;
