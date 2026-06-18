import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  subtext?: string;
  trend?: { value: string; positive: boolean };
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  iconBg = "bg-teal/10",
  iconColor = "text-teal",
  subtext,
  trend,
}) => {
  return (
    <div className="card-surface p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-graphite-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
