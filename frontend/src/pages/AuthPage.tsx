import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import api, { API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState<"admin" | "owner">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      login(data.token, data, null);
      navigate("/admin/overview");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Full-page redirect into the real Google OAuth flow. The backend
  // (passport-google-oauth20) sends the browser to Google's consent
  // screen, then Google redirects back to /api/auth/google/callback,
  // which redirects again to /auth/callback#token=... on the frontend.
  // AuthCallbackPage picks up the token from there and finishes login.
  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google/redirect`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-graphite-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Pharma Pulse</p>
            <p className="text-xs text-slate-400">Stock Easy Platform</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Complete pharmacy management,{" "}
            <span className="text-teal">built for compliance.</span>
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            FEFO inventory control, CGHS split billing, expiry tracking and a live AI assistant — everything your
            pharmacy needs, in one platform.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Active Tenants", value: "340+" },
              { label: "Bills Processed", value: "2.4L+" },
              { label: "Medicines Tracked", value: "18,000+" },
              { label: "States Covered", value: "22" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-graphite-700/50 p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Pharma Pulse. All rights reserved.
        </p>
      </div>

      {/* Right auth panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Back to landing page */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-graphite-900">Pharma Pulse</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-graphite-900">Sign in to your account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose your login method below
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => { setTab("owner"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === "owner" ? "bg-graphite-900 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Shop Owner
            </button>
            <button
              onClick={() => { setTab("admin"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === "admin" ? "bg-graphite-900 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Central Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
              {error}
            </div>
          )}

          {/* Shop Owner - Google Sign In */}
          {tab === "owner" && (
            <div className="animate-fade-in space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-7 w-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-graphite-900">Sign in with Google</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Shop owners and pharmacy staff sign in using their Google account.
                </p>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-5 w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <p className="mt-3 text-xs text-slate-400">
                  You'll register your pharmacy details the first time you sign in.
                </p>
              </div>
            </div>
          )}

          {/* Admin - Email/Password */}
          {tab === "admin" && (
            <form onSubmit={handleAdminLogin} className="animate-fade-in space-y-4">
              <div>
                <label className="label-field">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pharmapulse.com"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In to Admin Suite"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;