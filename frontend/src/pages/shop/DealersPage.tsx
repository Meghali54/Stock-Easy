import React, { useEffect, useState, useCallback } from "react";
import { Plus, Truck, Edit2, X, Loader2, CheckCircle } from "lucide-react";
import api from "../../services/api";

const BLANK = { name:"", contactPerson:"", phone:"", email:"", address:"", gstin:"", notes:"", outstandingBalance:0 };

const DealersPage: React.FC = () => {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [form, setForm] = useState<any>({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/dealers");
    setDealers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ ...BLANK }); setEditId(null); setError(""); setModal("add"); };
  const openEdit = (d: any) => {
    setForm({ name: d.name, contactPerson: d.contactPerson, phone: d.phone, email: d.email, address: d.address, gstin: d.gstin, notes: d.notes, outstandingBalance: d.outstandingBalance });
    setEditId(d._id); setError(""); setModal("edit");
  };

  const handleSave = async () => {
    setError(""); setSaving(true);
    try {
      if (modal === "add") await api.post("/dealers", form);
      else await api.put(`/dealers/${editId}`, form);
      setModal(null); fetch();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this dealer?")) return;
    await api.delete(`/dealers/${id}`);
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary gap-2 !py-2 !text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Dealer
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-teal border-t-transparent" /></div>
      ) : dealers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
          <Truck className="mb-2 h-8 w-8 text-slate-300" />
          No dealers yet. Add your first supplier.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dealers.map((d) => (
            <div key={d._id} className="card-surface p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-graphite-900">{d.name}</p>
                  {d.contactPerson && <p className="text-xs text-slate-500">{d.contactPerson}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(d)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-teal hover:text-teal">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(d._id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                {d.phone && <p>📞 {d.phone}</p>}
                {d.email && <p>✉️ {d.email}</p>}
                {d.gstin && <p className="font-mono text-xs">GST: {d.gstin}</p>}
                {d.outstandingBalance > 0 && (
                  <p className="font-semibold text-rose-600">Outstanding: ₹{d.outstandingBalance.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-graphite-900">{modal === "add" ? "Add Dealer" : "Edit Dealer"}</h3>
              <button onClick={() => setModal(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}
            <div className="space-y-3">
              {[
                { key: "name", label: "Dealer Name *", placeholder: "MedSupply India Pvt Ltd" },
                { key: "contactPerson", label: "Contact Person", placeholder: "Ramesh Kumar" },
                { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
                { key: "email", label: "Email", placeholder: "sales@medsupply.com" },
                { key: "address", label: "Address", placeholder: "123, Pharma Market, Mumbai" },
                { key: "gstin", label: "GSTIN", placeholder: "27ABCDE1234F1Z5" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label-field">{label}</label>
                  <input className="input-field" value={form[key]} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="label-field">Outstanding Balance (₹)</label>
                <input type="number" className="input-field" value={form.outstandingBalance} onChange={(e) => setField("outstandingBalance", Number(e.target.value))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex-1 gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Save
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

export default DealersPage;
