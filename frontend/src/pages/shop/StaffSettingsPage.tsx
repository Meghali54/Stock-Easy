import React, { useEffect, useState, useCallback } from "react";
import { Users, Plus, X, Loader2, CheckCircle, ToggleLeft, ToggleRight, Settings } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";

const StaffSettingsPage: React.FC = () => {
  const { user, shop } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/staff");
      setStaff(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleAddStaff = async () => {
    setError(""); setSaving(true);
    try {
      await api.post("/staff", { name: newName, email: newEmail });
      setShowModal(false);
      setNewName(""); setNewEmail("");
      fetchStaff();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const { data } = await api.patch(`/staff/${id}/status`, {});
      setStaff((prev) => prev.map((s) => s._id === id ? { ...s, isActive: data.isActive } : s));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    await api.delete(`/staff/${id}`);
    fetchStaff();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Shop info card */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
            <Settings className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h2 className="text-base font-bold text-graphite-900">Shop Information</h2>
            <p className="text-xs text-slate-500">Your pharmacy profile</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
          {[
            { label: "Shop Name", value: shop?.name },
            { label: "Owner", value: shop?.ownerName },
            { label: "Subscription", value: shop?.subscriptionTier },
            { label: "Drug License", value: shop?.drugLicenseNumber },
            { label: "GSTIN", value: shop?.gstin },
            { label: "PAN", value: shop?.panNumber },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <p className="mt-0.5 font-semibold text-graphite-900">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff management */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-graphite-900">Staff Members</h2>
              <p className="text-xs text-slate-500">{staff.length} user(s) on this shop</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2 !py-2 !text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Staff
          </button>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal border-t-transparent" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {staff.map((member) => (
              <div key={member._id} className="flex items-center justify-between py-3.5 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-graphite-900 text-sm font-bold text-white">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-graphite-900">{member.name}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          member.role === "shop_owner"
                            ? "bg-teal/10 text-teal"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.role === "shop_owner" ? "Owner" : "Staff"}
                      </span>
                      {!member.isActive && (
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {member.email} · Joined {format(new Date(member.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>

                {/* Only show actions for staff (not the owner themselves) */}
                {member.role === "pharmacy_staff" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(member._id)}
                      disabled={togglingId === member._id}
                      title={member.isActive ? "Deactivate" : "Activate"}
                      className="text-slate-400 hover:text-teal transition-colors"
                    >
                      {togglingId === member._id ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : member.isActive ? (
                        <ToggleRight className="h-5 w-5 text-teal" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Staff members sign in using the same Google auth flow on the main login page. Pre-register their email here
          so they are auto-linked to your shop on first login.
        </p>
      </div>

      {/* Signed-in user info */}
      <div className="card-surface p-5">
        <h2 className="mb-3 text-base font-bold text-graphite-900">Your Account</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-lg font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-graphite-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">Signed in via Google · {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Add staff modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-graphite-900">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="label-field">Full Name *</label>
                <input
                  className="input-field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Anjali Mehta"
                />
              </div>
              <div>
                <label className="label-field">Google Email *</label>
                <input
                  className="input-field"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="anjali@gmail.com"
                />
              </div>
              <p className="text-xs text-slate-400">
                This email must match exactly the Google account they use to sign in.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddStaff}
                  disabled={saving || !newName || !newEmail}
                  className="btn-primary flex-1 gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Add Staff
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSettingsPage;
