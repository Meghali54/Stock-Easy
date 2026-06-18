import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import AiAssistantDrawer from "../../components/AiAssistantDrawer";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/shop/dashboard": { title: "Dashboard", subtitle: "Today's snapshot" },
  "/shop/pos": { title: "POS Terminal", subtitle: "Process a new sale" },
  "/shop/inventory": { title: "Inventory Ledger", subtitle: "Full stock audit matrix" },
  "/shop/medicines": { title: "Medicine Catalog", subtitle: "Manage your product master" },
  "/shop/dealers": { title: "Dealers & Suppliers", subtitle: "Vendor management" },
  "/shop/bills": { title: "Sales History", subtitle: "All processed bills" },
  "/shop/reports": { title: "Reports & Analytics", subtitle: "Sales trends and insights" },
  "/shop/staff": { title: "Staff & Settings", subtitle: "Team and configuration" },
};

const ShopLayout: React.FC = () => {
  const { pathname } = useLocation();
  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Shop", subtitle: "" };
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mode="shop" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          title={title}
          subtitle={subtitle}
          showAiButton
          onToggleAi={() => setAiOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AiAssistantDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default ShopLayout;
