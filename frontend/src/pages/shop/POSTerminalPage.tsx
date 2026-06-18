import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, CheckCircle, X, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../../services/api";
import { format } from "date-fns";

interface SearchResult {
  _id: string;
  name: string;
  genericName: string;
  category: string;
  unit: string;
  gstRate: number;
  totalRemaining: number;
  sellingPrice: number;
  nearestExpiry: string | null;
  fefoBatchId: string | null;
  fefoBatchNumber: string | null;
}

interface CartItem {
  medicineId: string;
  name: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  gstRate: number;
  totalRemaining: number;
}

const POSTerminalPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card" | "UPI" | "CGHS Split">("Cash");
  const [cghsEnabled, setCghsEnabled] = useState(false);
  const [cghsCardNumber, setCghsCardNumber] = useState("");
  const [patientSharePercent, setPatientSharePercent] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completedBill, setCompletedBill] = useState<any>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<any>(null);

  const searchMedicines = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/medicines/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMedicines(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchMedicines]);

  const addToCart = (med: SearchResult) => {
    setResults([]);
    setQuery("");
    setCart((prev) => {
      const existing = prev.find((c) => c.medicineId === med._id);
      if (existing) {
        return prev.map((c) =>
          c.medicineId === med._id ? { ...c, quantity: Math.min(c.quantity + 1, c.totalRemaining) } : c
        );
      }
      return [
        ...prev,
        {
          medicineId: med._id,
          name: med.name,
          unit: med.unit,
          quantity: 1,
          sellingPrice: med.sellingPrice,
          gstRate: med.gstRate,
          totalRemaining: med.totalRemaining,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.medicineId === id ? { ...c, quantity: Math.max(1, Math.min(c.quantity + delta, c.totalRemaining)) } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.medicineId !== id));

  const subTotal = cart.reduce((s, c) => s + c.quantity * c.sellingPrice, 0);
  const taxAmount = cart.reduce((s, c) => s + (c.quantity * c.sellingPrice * c.gstRate) / 100, 0);
  const total = Math.max(0, subTotal + taxAmount - discount);

  const patientShare = Math.round((total * patientSharePercent) / 100);
  const cghsShare = total - patientShare;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setError("");
    setProcessing(true);
    try {
      const { data } = await api.post("/bills/checkout", {
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        items: cart.map((c) => ({ medicineId: c.medicineId, quantity: c.quantity })),
        paymentMode: cghsEnabled ? "CGHS Split" : paymentMode,
        discountAmount: discount,
        cghsSplit: cghsEnabled
          ? { patientSharePercent, cghsCardNumber }
          : undefined,
      });
      setCompletedBill(data);
      setCart([]);
      setQuery("");
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);
      setCghsEnabled(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Checkout failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (completedBill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-bold text-graphite-900">Sale Complete!</h2>
          <p className="mt-1 text-sm text-slate-600">Bill #{completedBill.billNumber}</p>
          <div className="mt-5 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-semibold">{completedBill.customerName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sub-total</span><span>₹{completedBill.subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>₹{completedBill.taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-graphite-900">Total</span><span className="text-xl font-bold text-teal">₹{completedBill.totalAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold">{completedBill.paymentMode}</span></div>
            {completedBill.cghsSplit?.enabled && (
              <>
                <div className="flex justify-between text-xs text-slate-500"><span>Patient ({completedBill.cghsSplit.patientSharePercent}%)</span><span>₹{completedBill.cghsSplit.patientShareAmount}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>CGHS ({completedBill.cghsSplit.cghsSharePercent}%)</span><span>₹{completedBill.cghsSplit.cghsShareAmount}</span></div>
              </>
            )}
          </div>
          <button onClick={() => setCompletedBill(null)} className="btn-primary mt-6 w-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left: Search + Cart */}
      <div className="lg:col-span-3 space-y-4">
        {/* Medicine search */}
        <div className="card-surface p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input-field pl-10"
              placeholder="Search medicines by name or generic name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-teal" />}
          </div>

          {results.length > 0 && (
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {results.map((med) => (
                <button
                  key={med._id}
                  onClick={() => addToCart(med)}
                  disabled={med.totalRemaining === 0}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-graphite-900">{med.name}</p>
                    <p className="text-xs text-slate-500">
                      {med.genericName} · {med.category} · {med.totalRemaining} {med.unit}s available
                    </p>
                    {med.nearestExpiry && (
                      <p className="text-xs text-amber-600">
                        Earliest expiry: {format(new Date(med.nearestExpiry), "MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-teal">₹{med.sellingPrice.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">GST {med.gstRate}%</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="card-surface overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-graphite-900">Cart — {cart.length} item(s)</h3>
          </div>

          {cart.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Search and add medicines above to start a sale
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.medicineId} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-graphite-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">₹{item.sellingPrice.toFixed(2)} / {item.unit} · GST {item.gstRate}%</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.medicineId, -1)} className="btn-secondary !p-1.5 !rounded-lg">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.medicineId, 1)} disabled={item.quantity >= item.totalRemaining} className="btn-secondary !p-1.5 !rounded-lg disabled:opacity-40">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-bold text-graphite-900">
                    ₹{(item.quantity * item.sellingPrice).toFixed(2)}
                  </p>
                  <button onClick={() => removeItem(item.medicineId)} className="text-slate-300 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Billing panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Customer details */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-graphite-900">Customer</h3>
          <input className="input-field" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="input-field" placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </div>

        {/* Payment mode */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-graphite-900">Payment Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["Cash", "Card", "UPI"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setPaymentMode(mode); setCghsEnabled(false); }}
                className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
                  paymentMode === mode && !cghsEnabled ? "border-teal bg-teal text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {mode}
              </button>
            ))}
            <button
              onClick={() => { setCghsEnabled((v) => !v); if (!cghsEnabled) setPaymentMode("CGHS Split"); }}
              className={`rounded-xl border py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                cghsEnabled ? "border-teal bg-teal text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cghsEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              CGHS Split
            </button>
          </div>

          {/* CGHS split config */}
          {cghsEnabled && (
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 space-y-2 animate-fade-in">
              <p className="text-xs font-semibold text-teal">CGHS 80/20 Co-pay Split</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">Patient share %</span>
                <input
                  type="number"
                  min={0} max={100}
                  className="input-field !py-1.5 !text-xs w-20"
                  value={patientSharePercent}
                  onChange={(e) => setPatientSharePercent(Number(e.target.value))}
                />
              </div>
              <input
                className="input-field !text-xs !py-1.5"
                placeholder="CGHS Card Number"
                value={cghsCardNumber}
                onChange={(e) => setCghsCardNumber(e.target.value)}
              />
              <div className="flex justify-between text-xs font-medium text-slate-600 pt-1 border-t border-teal/20">
                <span>Patient pays ({patientSharePercent}%)</span>
                <span className="text-graphite-900 font-bold">₹{patientShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>CGHS pays ({100 - patientSharePercent}%)</span>
                <span className="text-graphite-900 font-bold">₹{cghsShare.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bill summary */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-graphite-900">Bill Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500"><span>Sub-total</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500"><span>GST</span><span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Discount</span>
              <input
                type="number" min={0}
                className="input-field !py-1 !text-xs w-24 text-right"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-graphite-900 text-base">
              <span>Total</span>
              <span className="text-teal">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-start gap-2">
              <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="btn-primary w-full py-3 text-base gap-2"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {processing ? "Processing…" : `Checkout — ₹${total.toFixed(2)}`}
          </button>
          <p className="text-center text-xs text-slate-400">Stock deducted via FEFO batch allocation</p>
        </div>
      </div>
    </div>
  );
};

export default POSTerminalPage;
