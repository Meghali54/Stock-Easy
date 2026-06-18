import React from "react";
import { LogOut, Sparkles, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  title: string;
  subtitle?: string;
  onToggleAi?: () => void;
  showAiButton?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title, subtitle, onToggleAi, showAiButton }) => {
  const { user, shop, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-graphite-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {showAiButton && (
          <button
            onClick={onToggleAi}
            className="btn-secondary !rounded-full !px-4 !py-2 border-teal/30 text-teal hover:bg-teal/5"
          >
            <Sparkles className="h-4 w-4" />
            Stock Easy AI
          </button>
        )}

        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-graphite-900">{user?.name}</p>
            <p className="text-xs leading-tight text-slate-400">
              {shop ? shop.name : user?.role === "central_admin" ? "Central Admin" : user?.role}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
