import React, { useEffect, useState, useCallback } from "react";
import { Receipt, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";
import { format } from "date-fns";

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Card: "bg-sky-50 text-sky-700 border-sky-200",
  UPI: "bg-violet-50 text-violet-700 border-violet-200",
  "CGHS Split": "bg-teal/10 text-teal border-teal/30",
};

const SalesHistoryPage: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchBills = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bills?page=${p}&limit=15`);
      setBills(data.bills);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(page); }, [page, fetchBills]);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-graphite-900">{total}</span> total bills
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary !p-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-secondary !p-2 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bills list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        </div>
      ) : bills.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
          <Receipt className="mb-2 h-8 w-8 text-slate-300" />
          No bills yet — process your first sale at the POS Terminal.
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in"
            >
              {/* Bill header row */}
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-slate-50"
                onClick={() => setExpanded(expanded === bill._id ? null : bill._id)}
              >
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-teal/10">
                    <Receipt className="h-4 w-4 text-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-graphite-900">{bill.billNumber}</p>
                    <p className="text-xs text-slate-500">
                      {bill.customerName} · {format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      PAYMENT_COLORS[bill.paymentMode] || "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {bill.paymentMode}
                  </span>
                  <span className="text-base font-bold text-teal">₹{bill.totalAmount.toFixed(2)}</span>
                  {expanded === bill._id ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded bill details */}
              {expanded === bill._id && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 animate-fade-in">
                  {/* Items table */}
                  <table className="w-full text-xs mb-4">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-200">
                        <th className="pb-2 text-left font-semibold">Medicine</th>
                        <th className="pb-2 text-left font-semibold">Batch</th>
                        <th className="pb-2 text-center font-semibold">Qty</th>
                        <th className="pb-2 text-right font-semibold">Unit ₹</th>
                        <th className="pb-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bill.items.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="py-1.5 font-medium text-graphite-900">{item.medicineName}</td>
                          <td className="py-1.5 font-mono text-slate-500">{item.batchNumber}</td>
                          <td className="py-1.5 text-center">{item.quantitySold}</td>
                          <td className="py-1.5 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-semibold">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-56 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Sub-total</span><span>₹{bill.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST</span><span>₹{bill.taxAmount.toFixed(2)}</span>
                      </div>
                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span><span>-₹{bill.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-graphite-900">
                        <span>Total</span><span className="text-teal">₹{bill.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CGHS split breakdown */}
                  {bill.cghsSplit?.enabled && (
                    <div className="mt-3 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-xs">
                      <p className="font-semibold text-teal mb-1.5">CGHS Split Billing</p>
                      <div className="flex justify-between text-slate-600">
                        <span>Patient ({bill.cghsSplit.patientSharePercent}%)</span>
                        <span className="font-bold">₹{bill.cghsSplit.patientShareAmount}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CGHS ({bill.cghsSplit.cghsSharePercent}%)</span>
                        <span className="font-bold">₹{bill.cghsSplit.cghsShareAmount}</span>
                      </div>
                      {bill.cghsSplit.cghsCardNumber && (
                        <p className="mt-1 text-slate-400">Card: {bill.cghsSplit.cghsCardNumber}</p>
                      )}
                    </div>
                  )}

                  <p className="mt-3 text-xs text-slate-400">
                    Processed by {bill.createdBy?.name || "Staff"} ·{" "}
                    {format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
