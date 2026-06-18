import React from "react";
import { Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="card-surface p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
            <Settings className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h2 className="text-base font-bold text-graphite-900">Admin Account</h2>
            <p className="text-xs text-slate-500">Central administrator profile</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Role", value: user?.role },
            { label: "Auth Provider", value: "Credentials (Email/Password)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-slate-100 pb-3 text-sm">
              <span className="font-medium text-slate-500">{label}</span>
              <span className="font-semibold text-graphite-900">{value || "—"}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-slate-400">
          To change your password, restart the backend with updated ADMIN_SEED_PASSWORD and re-run seed.js.
        </p>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
