import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, ShieldCheck, Zap, BarChart3, Pill,
  CheckCircle, ChevronRight, Star, Users, Building2, TrendingUp,
  Clock, Package, IndianRupee, Sparkles,
} from "lucide-react";

/* ─── Animated dashboard mockup component ─────────────────────────────── */
const DashboardMockup: React.FC = () => {
  const [activePulse, setActivePulse] = useState(0);
  const bars = [42, 68, 55, 80, 63, 91, 74];

  useEffect(() => {
    const id = setInterval(() => setActivePulse((p) => (p + 1) % bars.length), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-3xl bg-teal/20 blur-3xl scale-95 -z-10" />

      {/* Browser chrome */}
      <div className="rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded-full bg-white/5 flex items-center px-3">
            <span className="text-[10px] text-slate-500">pharmapulse.app/shop/dashboard</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="w-40 shrink-0 bg-[#0f172a] border-r border-white/5 p-3 space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
              <div className="h-5 w-5 rounded bg-teal flex items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white">Pharma Pulse</span>
            </div>
            {[
              { label: "Dashboard", active: true },
              { label: "POS Terminal", active: false },
              { label: "Inventory", active: false },
              { label: "Medicines", active: false },
              { label: "Reports", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                  item.active ? "bg-teal" : "hover:bg-white/5"
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-white" : "bg-slate-600"}`} />
                <span className={`text-[9px] font-medium ${item.active ? "text-white" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* KPI cards row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Today's Revenue", value: "₹24,680", color: "text-teal", sub: "↑ 12% vs yesterday" },
                { label: "Bills Processed", value: "47", color: "text-violet-400", sub: "since 9:00 AM" },
                { label: "Expiring Soon", value: "8", color: "text-amber-400", sub: "within 90 days" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl bg-[#1e293b] border border-white/5 p-2.5">
                  <p className="text-[8px] text-slate-500 mb-1">{kpi.label}</p>
                  <p className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[7px] text-slate-600 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Revenue chart area */}
            <div className="rounded-xl bg-[#1e293b] border border-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold text-slate-300">7-Day Revenue Trend</p>
                <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              </div>
              <div className="flex items-end gap-1.5 h-14">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className={`w-full rounded-t transition-all duration-700 ${
                        i === activePulse ? "bg-teal" : "bg-teal/30"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="flex-1 text-center text-[7px] text-slate-600">{d}</span>
                ))}
              </div>
            </div>

            {/* Expiry alert row */}
            <div className="space-y-1.5">
              {[
                { name: "Amoxicillin 500mg", days: 12, qty: 240 },
                { name: "Metformin 850mg", days: 28, qty: 96 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                  <span className="text-[9px] text-amber-200 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-500">{item.qty} units</span>
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                      {item.days}d left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Feature card ─────────────────────────────────────────────────────── */
const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: string;
}> = ({ icon: Icon, title, description, accent = "bg-teal/10 text-teal" }) => (
  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mb-2 text-base font-bold text-[#1E293B]">{title}</h3>
    <p className="text-sm leading-relaxed text-slate-500">{description}</p>
  </div>
);

/* ─── Testimonial card ─────────────────────────────────────────────────── */
const TestimonialCard: React.FC<{
  quote: string;
  name: string;
  role: string;
  city: string;
}> = ({ quote, name, role, city }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-sm leading-relaxed text-slate-600 mb-5">{quote}</p>
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D9488] text-sm font-bold text-white">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1E293B]">{name}</p>
        <p className="text-xs text-slate-400">{role} · {city}</p>
      </div>
    </div>
  </div>
);

/* ─── Pricing card ─────────────────────────────────────────────────────── */
const PricingCard: React.FC<{
  tier: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCta: () => void;
}> = ({ tier, price, period, features, highlighted, cta, onCta }) => (
  <div
    className={`relative rounded-2xl border p-7 transition-all duration-200 hover:shadow-lg ${
      highlighted
        ? "border-teal bg-[#0D9488] text-white shadow-lg shadow-teal/20"
        : "border-slate-200 bg-white"
    }`}
  >
    {highlighted && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-graphite-900">
        Most Popular
      </span>
    )}
    <p className={`text-sm font-semibold mb-1 ${highlighted ? "text-teal-100" : "text-slate-500"}`}>{tier}</p>
    <div className="flex items-end gap-1 mb-1">
      <span className={`text-4xl font-extrabold ${highlighted ? "text-white" : "text-[#1E293B]"}`}>{price}</span>
      {period && <span className={`mb-1 text-sm ${highlighted ? "text-teal-100" : "text-slate-400"}`}>{period}</span>}
    </div>
    <p className={`text-xs mb-6 ${highlighted ? "text-teal-100" : "text-slate-400"}`}>per pharmacy per month</p>
    <ul className="space-y-2.5 mb-7">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${highlighted ? "text-teal-100" : "text-teal"}`} />
          <span className={highlighted ? "text-teal-50" : "text-slate-600"}>{f}</span>
        </li>
      ))}
    </ul>
    <button
      onClick={onCta}
      className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        highlighted
          ? "bg-white text-teal hover:bg-teal-50"
          : "bg-[#0D9488] text-white hover:bg-[#0F766E]"
      }`}
    >
      {cta}
    </button>
  </div>
);

/* ─── Counter animation hook ───────────────────────────────────────────── */
const useCounter = (target: number, duration = 1800) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setValue(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
};

const StatCounter: React.FC<{ value: number; suffix: string; label: string }> = ({ value, suffix, label }) => {
  const { value: animated, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-extrabold text-white">
        {animated.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-sm text-teal-100">{label}</p>
    </div>
  );
};

/* ─── Main Landing Page ────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#1E293B] antialiased overflow-x-hidden">

      {/* ── Sticky Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/60"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9488]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-[#1E293B] leading-tight block">Pharma Pulse</span>
              <span className="text-[10px] text-slate-400 leading-tight block -mt-0.5">Stock Easy</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0D9488] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0D9488] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#0D9488] transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-[#0D9488] transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="hidden sm:block rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="rounded-xl bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] transition-colors shadow-sm"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 bg-[#0f172a] overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 25% 40%, #0D9488 0%, transparent 50%), radial-gradient(circle at 80% 70%, #0F766E 0%, transparent 45%)"
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                <span className="text-xs font-semibold text-teal">Trusted by 340+ pharmacies across India</span>
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
                The pharmacy platform{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-[#2dd4bf]">
                  built for compliance.
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
                FEFO inventory control, CGHS split billing, near-expiry alerts, and a live AI assistant —
                everything your pharmacy needs to stay compliant and profitable, in one place.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2 rounded-xl bg-[#0D9488] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-teal/20 hover:bg-[#0F766E] transition-colors"
                >
                  Start Free — No Card Required
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-base font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                >
                  See How It Works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                {["No setup fee", "14-day free trial", "Cancel anytime", "GDPR compliant"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-teal" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: live dashboard mockup */}
            <div className="animate-fade-in">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#0D9488] py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatCounter value={340} suffix="+" label="Active Pharmacies" />
            <StatCounter value={240000} suffix="+" label="Bills Processed" />
            <StatCounter value={18000} suffix="+" label="Medicines Tracked" />
            <StatCounter value={22} suffix="" label="States Covered" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9488] mb-3">Platform Features</p>
            <h2 className="text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Everything your pharmacy needs
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Built specifically for Indian pharmacies — from solo chemists to multi-branch chains.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="FEFO Checkout Engine"
              description="First-Expiry-First-Out batch allocation runs inside a full MongoDB transaction. Multi-batch splits happen atomically — if stock falls short on any item, the whole sale rolls back."
              accent="bg-teal/10 text-teal"
            />
            <FeatureCard
              icon={IndianRupee}
              title="CGHS Split Billing"
              description="Toggle the 80/20 co-pay split per transaction. Patient share and CGHS claim amounts are computed automatically and stored on every bill for audit-ready records."
              accent="bg-emerald-100 text-emerald-600"
            />
            <FeatureCard
              icon={Package}
              title="Inventory Ledger"
              description="Four instant filter tabs — All Stock, Expiring Soon, Out of Stock, Dead Stock — with amber and red expiry badges. Add GRN entries with a single modal."
              accent="bg-violet-100 text-violet-600"
            />
            <FeatureCard
              icon={BarChart3}
              title="Live Analytics Dashboard"
              description="Today's turnover, 7-day revenue trend, product category distribution, near-expiry alerts and low-stock warnings — all on one page, refreshed on every visit."
              accent="bg-sky-100 text-sky-600"
            />
            <FeatureCard
              icon={Sparkles}
              title="Stock Easy AI Assistant"
              description="Ask questions in plain language — 'What's expiring soon?', 'How are today's sales?', 'What needs reordering?' — and get answers grounded in your live shop data."
              accent="bg-amber-100 text-amber-600"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Multi-Tenant with Verification"
              description="Every pharmacy goes through a 4-step compliance onboarding. Central Admin reviews drug licenses, PAN, and GSTIN before approving access to the full platform."
              accent="bg-rose-100 text-rose-600"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9488] mb-3">Onboarding</p>
            <h2 className="text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Live in under 10 minutes
            </h2>
            <p className="mt-4 text-lg text-slate-500">From sign-up to first sale, with no installation required.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-slate-200 hidden md:block md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-10">
              {[
                {
                  step: "01",
                  title: "Sign up with Google",
                  description: "Shop owners sign in using their Google account — no separate password to manage. Staff get added by email and auto-linked on their first login.",
                  icon: Users,
                  side: "left",
                },
                {
                  step: "02",
                  title: "Complete the verification wizard",
                  description: "A 4-step guided form captures your drug license, PAN, GSTIN and shop address. Document upload simulators let you attach scanned copies instantly.",
                  icon: ShieldCheck,
                  side: "right",
                },
                {
                  step: "03",
                  title: "Admin reviews and approves",
                  description: "Our compliance team reviews your credentials. Once approved, your full 8-page dashboard unlocks instantly — no refresh needed.",
                  icon: CheckCircle,
                  side: "left",
                },
                {
                  step: "04",
                  title: "Start selling with FEFO accuracy",
                  description: "Load your medicine catalog, add stock batches, and process your first sale. The checkout engine handles FEFO batch splitting and CGHS billing automatically.",
                  icon: Zap,
                  side: "right",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`relative flex gap-6 md:gap-0 ${
                    item.side === "right" ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
                >
                  {/* Step content */}
                  <div className={`flex-1 md:px-10 ${item.side === "right" ? "md:text-right" : ""}`}>
                    <div className={`inline-flex items-center gap-2 mb-3 ${item.side === "right" ? "md:flex-row-reverse" : ""}`}>
                      <span className="text-xs font-bold text-[#0D9488] tracking-widest">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1E293B] mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm">{item.description}</p>
                  </div>

                  {/* Centre icon */}
                  <div className="hidden md:flex shrink-0 z-10 h-10 w-10 items-center justify-center rounded-full bg-[#0D9488] text-white shadow-md shadow-teal/20">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9488] mb-3">Testimonials</p>
            <h2 className="text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Trusted by pharmacists across India
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <TestimonialCard
              quote="The FEFO checkout alone saved us from dispensing expired stock twice last month. The expiry alerts are visible the moment we open the dashboard — no digging around."
              name="Dr. Priya Sharma"
              role="Owner, City Medical"
              city="Delhi"
            />
            <TestimonialCard
              quote="CGHS billing used to take us 20 minutes per patient. Now the split is calculated automatically and the breakdown prints on the receipt. Our CGHS patients love it."
              name="Rahul Verma"
              role="Pharmacist, Arogya Medicals"
              city="Lucknow"
            />
            <TestimonialCard
              quote="We manage 3 branches under one admin account. The verification queue makes onboarding new locations painless — approve and they're live immediately."
              name="Meena Iyer"
              role="Operations Head, Wellness Plus"
              city="Bengaluru"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9488] mb-3">Pricing</p>
            <h2 className="text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-500">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PricingCard
              tier="Basic"
              price="₹999"
              period="/mo"
              features={[
                "1 pharmacy location",
                "FEFO POS checkout",
                "Inventory ledger",
                "Basic reports",
                "Up to 3 staff accounts",
                "Email support",
              ]}
              cta="Start Free Trial"
              onCta={() => navigate("/auth")}
            />
            <PricingCard
              tier="Pro"
              price="₹2,499"
              period="/mo"
              features={[
                "Up to 3 pharmacy locations",
                "Everything in Basic",
                "CGHS split billing",
                "Stock Easy AI Assistant",
                "Advanced analytics & reports",
                "Unlimited staff accounts",
                "Priority support",
              ]}
              highlighted
              cta="Start Free Trial"
              onCta={() => navigate("/auth")}
            />
            <PricingCard
              tier="Enterprise"
              price="₹4,999"
              period="/mo"
              features={[
                "Unlimited locations",
                "Everything in Pro",
                "Custom onboarding",
                "Dedicated account manager",
                "SLA guarantee",
                "API access",
                "White-label option",
              ]}
              cta="Contact Sales"
              onCta={() => navigate("/auth")}
            />
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-24 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "radial-gradient(ellipse at center, #0D9488 0%, transparent 65%)"
        }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tight lg:text-5xl">
            Your pharmacy deserves better software.
          </h2>
          <p className="mt-5 text-lg text-slate-400 leading-relaxed">
            Join 340+ pharmacies already running on Pharma Pulse.
            Sign up in 30 seconds — no installation, no setup fee.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-[#0D9488] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-teal/20 hover:bg-[#0F766E] transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-4 text-sm text-slate-500">14 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f172a] border-t border-white/5 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0D9488]">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-tight">Pharma Pulse</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Stock Easy Platform</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
              <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-slate-300 transition-colors">Testimonials</a>
              <a href="mailto:support@pharmapulse.com" className="hover:text-slate-300 transition-colors">Support</a>
              <span className="text-slate-600">Privacy Policy</span>
              <span className="text-slate-600">Terms of Service</span>
            </div>

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Pharma Pulse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
