import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Clock, CheckCircle, FileSearch, ShieldCheck, Loader2, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TIMELINE_STEPS = [
  {
    icon: FileSearch,
    label: "Application Submitted",
    description: "Your shop registration has been received by our compliance team.",
    status: "done",
  },
  {
    icon: Clock,
    label: "Document Verification",
    description: "Our team is reviewing your Drug License, PAN, and GSTIN documents.",
    status: "active",
  },
  {
    icon: ShieldCheck,
    label: "Legal Compliance Check",
    description: "Cross-referencing your credentials with state pharmacy board records.",
    status: "pending",
  },
  {
    icon: CheckCircle,
    label: "Account Approved",
    description: "Full dashboard access granted once verification is complete.",
    status: "pending",
  },
];

const PendingStatusPage: React.FC = () => {
  const { shop, logout, refreshShop } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [pollError, setPollError] = useState(false);

  // Poll the backend every 8s to detect approval from the admin panel.
  // Also runs an immediate check on mount in case approval happened
  // while this tab was inactive/backgrounded.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const success = await refreshShop();
      if (!cancelled) setPollError(!success);
    };

    poll(); // immediate check on mount
    const interval = setInterval(poll, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to status change instantly (refreshShop updates context, which
  // re-renders this component with the new `shop` value)
  useEffect(() => {
    if (shop?.verificationStatus === "Approved") {
      navigate("/shop/dashboard", { replace: true });
    } else if (shop?.verificationStatus === "Rejected") {
      navigate("/rejected", { replace: true });
    }
  }, [shop?.verificationStatus, navigate]);

  const handleManualCheck = async () => {
    setChecking(true);
    const success = await refreshShop();
    setPollError(!success);
    setChecking(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Minimal top bar - NO sidebar, nav links or dashboard elements */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-graphite-900">Pharma Pulse</p>
            <p className="text-xs text-slate-400">Stock Easy</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      {/* Centred content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Status card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Verification In Progress
            </span>
            <h1 className="mt-4 text-2xl font-bold text-graphite-900">
              Your application is under review
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{shop?.name || "Your pharmacy"}</strong> has been submitted for verification.
              Our compliance team is processing your credentials. This usually takes 1–2 business days.
            </p>
          </div>

          {/* Progress timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Verification Progress
            </h2>

            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Icon column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        step.status === "done"
                          ? "border-teal bg-teal text-white"
                          : step.status === "active"
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-slate-200 bg-white text-slate-300"
                      }`}
                    >
                      {step.status === "active" ? (
                        <step.icon className="h-4 w-4 animate-pulse" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${
                          step.status === "done" ? "bg-teal" : "bg-slate-200"
                        }`}
                        style={{ minHeight: "28px" }}
                      />
                    )}
                  </div>

                  {/* Text column */}
                  <div className="pb-6">
                    <p
                      className={`text-sm font-semibold ${
                        step.status === "done"
                          ? "text-teal"
                          : step.status === "active"
                          ? "text-amber-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="mt-2 btn-secondary w-full gap-2"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Check approval status
            </button>

            {pollError && (
              <p className="mt-3 text-center text-xs text-rose-500">
                Couldn't reach the server to check your status. Check your connection and try again.
              </p>
            )}

            <p className="mt-3 text-center text-xs text-slate-400">
              This page checks for updates automatically every few seconds.
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Have questions? Contact support at{" "}
            <a href="mailto:support@pharmapulse.com" className="text-teal underline">
              support@pharmapulse.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PendingStatusPage;
