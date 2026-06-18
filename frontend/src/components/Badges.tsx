import React from "react";

type Status = "ok" | "expiring_soon" | "expired" | "out_of_stock";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  ok: { label: "In Stock", className: "badge-ok" },
  expiring_soon: { label: "Expiring Soon", className: "badge-expiring" },
  expired: { label: "Expired", className: "badge-expired" },
  out_of_stock: { label: "Out of Stock", className: "badge-out" },
};

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ok;
  return <span className={config.className}>{config.label}</span>;
};

export const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const colors: Record<string, string> = {
    Trial: "bg-slate-100 text-slate-600 border-slate-200",
    Basic: "bg-sky-50 text-sky-700 border-sky-200",
    Pro: "bg-teal/10 text-teal border-teal/30",
    Enterprise: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[tier] || colors.Trial}`}>
      {tier}
    </span>
  );
};

export const VerificationBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] || map.Pending}`}>
      {status}
    </span>
  );
};
