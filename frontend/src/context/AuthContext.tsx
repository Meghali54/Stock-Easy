import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";

interface ShopInfo {
  _id: string;
  name: string;
  ownerName: string;
  verificationStatus: "Pending" | "Approved" | "Rejected";
  subscriptionTier: string;
  drugLicenseNumber: string;
  panNumber: string;
  gstin: string;
  rejectionReason?: string;
  createdAt: string;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: "central_admin" | "shop_owner" | "pharmacy_staff";
  shopId: string | null;
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  shop: ShopInfo | null;
  loading: boolean;
  needsOnboarding: boolean;
  login: (token: string, userData: UserInfo, shopData?: ShopInfo | null) => void;
  logout: () => void;
  refreshShop: () => Promise<boolean>;
  setShop: (shop: ShopInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived, never stored separately - this can never drift out of sync
  // with `user`/`shop` because it's computed fresh on every render.
  const needsOnboarding = !!user && user.role === "shop_owner" && !user.shopId;

  const bootstrap = async () => {
    const token = localStorage.getItem("pp_token");
    const cachedUser = localStorage.getItem("pp_user");

    if (!token || !cachedUser) {
      setLoading(false);
      return;
    }

    try {
      const cached = JSON.parse(cachedUser);
      setUser(cached);
      const { data } = await api.get("/auth/me");

      // If the token in storage belongs to a different account than what
      // was cached, the session was clobbered by another login in this
      // same browser (e.g. admin and shop owner logged in in the same
      // browser, both writing to the same localStorage keys). Force a
      // clean logout instead of silently showing the wrong user's data.
      if (cached._id && data._id && cached._id !== data._id) {
        console.warn("Session mismatch detected — clearing stale session.");
        localStorage.removeItem("pp_token");
        localStorage.removeItem("pp_user");
        setUser(null);
        setShop(null);
        setLoading(false);
        return;
      }

      setUser(data);
      setShop(data.shop || null);
      localStorage.setItem("pp_user", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to bootstrap session", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (token: string, userData: UserInfo, shopData: ShopInfo | null = null) => {
    localStorage.setItem("pp_token", token);
    localStorage.setItem("pp_user", JSON.stringify(userData));
    setUser(userData);
    setShop(shopData);
  };

  const logout = () => {
    localStorage.removeItem("pp_token");
    localStorage.removeItem("pp_user");
    setUser(null);
    setShop(null);
  };

  const refreshShop = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      setShop(data.shop || null);
      localStorage.setItem("pp_user", JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("Failed to refresh shop status", err);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, shop, loading, needsOnboarding, login, logout, refreshShop, setShop }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
