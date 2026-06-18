import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/overview": { title: "Platform Overview", subtitle: "Global tenant metrics and performance" },
  "/admin/verification": { title: "Verification Queue", subtitle: "Review and action pending applications" },
  "/admin/shops": { title: "All Tenants", subtitle: "Manage active and inactive pharmacies" },
  "/admin/subscriptions": { title: "Subscription Revenue", subtitle: "MRR tracking and tier management" },
  "/admin/settings": { title: "Admin Settings", subtitle: "System configuration" },
};

const AdminLayout: React.FC = () => {
  const { pathname } = useLocation();
  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Admin", subtitle: "" };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mode="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
