import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  CreditCard,
  Settings,
  ShoppingCart,
  Boxes,
  Pill,
  Truck,
  Receipt,
  BarChart3,
  Users,
  Activity,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/verification", label: "Verification Queue", icon: ShieldCheck },
  { to: "/admin/shops", label: "All Tenants", icon: Building2 },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const shopNav: NavItem[] = [
  { to: "/shop/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shop/pos", label: "POS Terminal", icon: ShoppingCart },
  { to: "/shop/inventory", label: "Inventory Ledger", icon: Boxes },
  { to: "/shop/medicines", label: "Medicine Catalog", icon: Pill },
  { to: "/shop/dealers", label: "Dealers", icon: Truck },
  { to: "/shop/bills", label: "Sales History", icon: Receipt },
  { to: "/shop/reports", label: "Reports", icon: BarChart3 },
  { to: "/shop/staff", label: "Staff & Settings", icon: Users },
];

const Sidebar: React.FC<{ mode: "admin" | "shop" }> = ({ mode }) => {
  const items = mode === "admin" ? adminNav : shopNav;

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-graphite-900 text-slate-200">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-white">Pharma Pulse</p>
          <p className="text-xs text-slate-400">Stock Easy</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal text-white shadow-sm"
                  : "text-slate-300 hover:bg-graphite-700 hover:text-white"
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-5 text-xs text-slate-500 border-t border-slate-700/60">
        <p>© {new Date().getFullYear()} Pharma Pulse</p>
        <p className="mt-0.5">{mode === "admin" ? "Central Admin Suite" : "Shop Operations Engine"}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
