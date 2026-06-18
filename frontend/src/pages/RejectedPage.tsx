import React from "react";
import { Activity, XCircle, LogOut, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RejectedPage: React.FC = () => {
  const { shop, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-graphite-900">Pharma Pulse</span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <XCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-graphite-900">Application Rejected</h1>
          <p className="mt-2 text-sm text-slate-500">
            Unfortunately, your shop registration could not be approved.
          </p>

          {shop?.rejectionReason && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 text-left">
              <strong>Reason: </strong>
              {shop.rejectionReason}
            </div>
          )}

          <a
            href="mailto:support@pharmapulse.com"
            className="btn-primary mt-6 inline-flex gap-2"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
};

export default RejectedPage;
