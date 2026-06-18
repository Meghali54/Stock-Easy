import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * Lands here after the full-page redirect chain:
 *   frontend -> /api/auth/google/redirect -> Google consent screen
 *   -> /api/auth/google/callback -> redirected here with
 *   #token=...&needsOnboarding=true|false in the URL hash.
 *
 * We never put the token in a query string (logged by servers/proxies);
 * it only ever exists in the hash fragment, which browsers don't send
 * to the server on a GET. We parse it here, ask /auth/me for the full
 * profile + shop using that token, then route to the right screen.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const completeLogin = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const token = params.get("token");
      const needsOnboarding = params.get("needsOnboarding") === "true";

      if (!token) {
        setError("No authentication token was returned. Please try signing in again.");
        return;
      }

      // Temporarily stash the token so the axios interceptor picks it
      // up for the /auth/me call below.
      localStorage.setItem("pp_token", token);

      try {
        const { data } = await api.get("/auth/me");
        login(token, data, data.shop || null);

        if (needsOnboarding || !data.shopId) {
          navigate("/onboarding", { replace: true });
        } else if (data.shop?.verificationStatus === "Pending") {
          navigate("/pending", { replace: true });
        } else if (data.shop?.verificationStatus === "Rejected") {
          navigate("/rejected", { replace: true });
        } else if (data.role === "central_admin") {
          navigate("/admin/overview", { replace: true });
        } else {
          navigate("/shop/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Failed to complete Google sign-in", err);
        setError("We couldn't complete your sign-in. Please try again.");
        localStorage.removeItem("pp_token");
      }
    };

    completeLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-semibold text-rose-600 mb-3">{error}</p>
          <button onClick={() => navigate("/auth")} className="btn-primary">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
        <p className="text-sm text-slate-500">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
