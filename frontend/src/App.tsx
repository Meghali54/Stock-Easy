import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Landing
import LandingPage from "./pages/LandingPage";

// Auth & Onboarding
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import PendingStatusPage from "./pages/PendingStatusPage";
import RejectedPage from "./pages/RejectedPage";

// Admin layout + pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import VerificationQueuePage from "./pages/admin/VerificationQueuePage";
import AllTenantsPage from "./pages/admin/AllTenantsPage";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Shop layout + pages
import ShopLayout from "./pages/shop/ShopLayout";
import ShopDashboardPage from "./pages/shop/ShopDashboardPage";
import POSTerminalPage from "./pages/shop/POSTerminalPage";
import InventoryLedgerPage from "./pages/shop/InventoryLedgerPage";
import MedicineCatalogPage from "./pages/shop/MedicineCatalogPage";
import DealersPage from "./pages/shop/DealersPage";
import SalesHistoryPage from "./pages/shop/SalesHistoryPage";
import ReportsPage from "./pages/shop/ReportsPage";
import StaffSettingsPage from "./pages/shop/StaffSettingsPage";

// ── Guards ──────────────────────────────────────────────────────────────────

/** Redirect to /auth if not logged in. */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/** Only central_admin may access admin routes. */
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "central_admin") return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/**
 * Only approved shop_owner / pharmacy_staff may access shop routes.
 * Un-approved or pending users are redirected to the appropriate lockout screen.
 */
const RequireApprovedShop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, shop, loading, needsOnboarding } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === "central_admin") return <Navigate to="/admin/overview" replace />;
  if (needsOnboarding || !user.shopId) return <Navigate to="/onboarding" replace />;
  if (shop?.verificationStatus === "Pending") return <Navigate to="/pending" replace />;
  if (shop?.verificationStatus === "Rejected") return <Navigate to="/rejected" replace />;
  return <>{children}</>;
};

const FullPageSpinner: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal border-t-transparent" />
  </div>
);

// ── Root: show landing page, but auto-redirect already logged-in users ─────

const RootRedirect: React.FC = () => {
  const { user, shop, loading, needsOnboarding } = useAuth();

  if (loading) return <FullPageSpinner />;

  // Already authenticated → skip landing, send to the right screen
  if (user) {
    if (user.role === "central_admin") return <Navigate to="/admin/overview" replace />;
    if (needsOnboarding || !user.shopId) return <Navigate to="/onboarding" replace />;
    if (shop?.verificationStatus === "Pending") return <Navigate to="/pending" replace />;
    if (shop?.verificationStatus === "Rejected") return <Navigate to="/rejected" replace />;
    return <Navigate to="/shop/dashboard" replace />;
  }

  // Not logged in → show the landing page
  return <LandingPage />;
};

// ── App Routes ──────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Onboarding (auth required, no approved shop yet) */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      {/* Verification lockout screens */}
      <Route
        path="/pending"
        element={
          <RequireAuth>
            <PendingStatusPage />
          </RequireAuth>
        }
      />
      <Route
        path="/rejected"
        element={
          <RequireAuth>
            <RejectedPage />
          </RequireAuth>
        }
      />

      {/* ── Central Admin Suite ── */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="verification" element={<VerificationQueuePage />} />
        <Route path="shops" element={<AllTenantsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ── Shop Operations Engine ── */}
      <Route
        path="/shop"
        element={
          <RequireApprovedShop>
            <ShopLayout />
          </RequireApprovedShop>
        }
      >
        <Route index element={<Navigate to="/shop/dashboard" replace />} />
        <Route path="dashboard" element={<ShopDashboardPage />} />
        <Route path="pos" element={<POSTerminalPage />} />
        <Route path="inventory" element={<InventoryLedgerPage />} />
        <Route path="medicines" element={<MedicineCatalogPage />} />
        <Route path="dealers" element={<DealersPage />} />
        <Route path="bills" element={<SalesHistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="staff" element={<StaffSettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
