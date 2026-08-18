import React, { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  Tag,
} from "lucide-react";
import api from "../../services/api";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────

interface BillItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantitySold: number;
  unitPrice: number;
  gstRate: number;
  lineTotal: number;
}

interface CghsSplit {
  enabled: boolean;
  patientSharePercent: number;
  cghsSharePercent: number;
  patientShareAmount: number;
  cghsShareAmount: number;
  cghsCardNumber: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMode: string;
  cghsSplit: CghsSplit;
  createdAt: string;
  createdBy?: { name: string };
}

// ── Payment badge colors ───────────────────────────────────────────────

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Card: "bg-sky-50 text-sky-700 border-sky-200",
  UPI: "bg-violet-50 text-violet-700 border-violet-200",
  "CGHS Split": "bg-teal-50 text-[#0D9488] border-teal-200",
};

// ── PDF Bill Generator ─────────────────────────────────────────────────
// Opens a new browser window with a clean, printable bill.
// Shows ONLY buyer-facing information:
//   ✓ Shop name, bill number, date
//   ✓ Customer name, phone
//   ✓ Medicine name, qty, rate, GST, line total
//   ✓ Sub-total, GST, discount, grand total
//   ✓ Payment mode
//   ✓ CGHS split breakdown (if applicable)
//   ✗ Batch numbers — NOT shown
//   ✗ Batch IDs — NOT shown
//   ✗ Internal stock details — NOT shown

const generateBillPDF = (bill: Bill, shopName: string) => {
  const printDate = format(new Date(), "dd MMM yyyy, hh:mm a");
  const billDate = format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a");

  const itemRows = bill.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">
          ${item.medicineName}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#475569">
          ${item.quantitySold}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;color:#475569">
          ₹${item.unitPrice.toFixed(2)}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#475569">
          ${item.gstRate}%
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:600;color:#0f172a">
          ₹${item.lineTotal.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const cghsSection = bill.cghsSplit?.enabled
    ? `
    <div style="margin-top:16px;padding:12px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px">
      <p style="font-size:12px;font-weight:700;color:#0D9488;margin:0 0 8px">
        CGHS Co-pay Split
      </p>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:4px">
        <span>Patient Share (${bill.cghsSplit.patientSharePercent}%)</span>
        <span style="font-weight:600;color:#0f172a">
          ₹${bill.cghsSplit.patientShareAmount.toFixed(2)}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569">
        <span>CGHS Claim (${bill.cghsSplit.cghsSharePercent}%)</span>
        <span style="font-weight:600;color:#0f172a">
          ₹${bill.cghsSplit.cghsShareAmount.toFixed(2)}
        </span>
      </div>
      ${
        bill.cghsSplit.cghsCardNumber
          ? `<p style="font-size:11px;color:#94a3b8;margin:6px 0 0">
               CGHS Card: ${bill.cghsSplit.cghsCardNumber}
             </p>`
          : ""
      }
    </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Bill ${bill.billNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1e293b; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
<div style="max-width:680px;margin:0 auto;padding:32px 24px">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:38px;height:38px;background:#0D9488;border-radius:10px;display:flex;align-items:center;justify-content:center">
        <span style="color:#fff;font-size:20px;font-weight:800">+</span>
      </div>
      <div>
        <p style="font-size:18px;font-weight:800;color:#0f172a;line-height:1.1">${shopName}</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:1px">Powered by Stock Easy</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="font-size:22px;font-weight:800;color:#0D9488">${bill.billNumber}</p>
      <p style="font-size:11px;color:#94a3b8;margin-top:2px">${billDate}</p>
      <span style="display:inline-block;margin-top:4px;padding:3px 10px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:20px;font-size:11px;font-weight:600;color:#0D9488">
        ${bill.paymentMode}
      </span>
    </div>
  </div>

  <!-- Divider -->
  <div style="height:2px;background:linear-gradient(90deg,#0D9488,#2dd4bf);border-radius:2px;margin-bottom:20px"></div>

  <!-- Customer -->
  <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-bottom:20px">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:8px">
      Bill To
    </p>
    <p style="font-size:15px;font-weight:700;color:#0f172a">${bill.customerName}</p>
    ${bill.customerPhone
      ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${bill.customerPhone}</p>`
      : ""}
  </div>

  <!-- Items -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;border-bottom:2px solid #e2e8f0">Medicine</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;border-bottom:2px solid #e2e8f0">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;border-bottom:2px solid #e2e8f0">Rate</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;border-bottom:2px solid #e2e8f0">GST</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;border-bottom:2px solid #e2e8f0">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
    <div style="width:260px">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:6px">
        <span>Sub-total</span><span>₹${bill.subTotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:6px">
        <span>GST</span><span>₹${bill.taxAmount.toFixed(2)}</span>
      </div>
      ${bill.discountAmount > 0
        ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#16a34a;margin-bottom:6px">
             <span>Discount</span><span>-₹${bill.discountAmount.toFixed(2)}</span>
           </div>`
        : ""}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0;padding-top:8px;margin-top:4px">
        <span>Total</span>
        <span style="color:#0D9488">₹${bill.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${cghsSection}

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center">
    <p style="font-size:12px;color:#94a3b8">Thank you for your purchase</p>
    <p style="font-size:10px;color:#cbd5e1;margin-top:4px">
      Printed on ${printDate} · Powered by Stock Easy
    </p>
  </div>

</div>

<!-- Print button hidden when printing -->
<div class="no-print" style="text-align:center;padding:20px">
  <button
    onclick="window.print()"
    style="background:#0D9488;color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer"
  >
    🖨️ Print Bill
  </button>
</div>

</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

// ── Main Page ──────────────────────────────────────────────────────────

const SalesHistoryPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shopName, setShopName] = useState("Pharmacy");

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

  useEffect(() => {
    fetchBills(page);
    api.get("/auth/me").then(({ data }) => {
      if (data.shop?.name) setShopName(data.shop.name);
    });
  }, [page, fetchBills]);

  return (
    <div className="space-y-4">

      {/* Summary + pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">{total}</span> total bills
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bills list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#0D9488] border-t-transparent" />
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
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Bill header */}
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-slate-50"
                onClick={() =>
                  setExpanded(expanded === bill._id ? null : bill._id)
                }
              >
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-teal-50">
                    <Receipt className="h-4 w-4 text-[#0D9488]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {bill.billNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bill.customerName} ·{" "}
                      {format(
                        new Date(bill.createdAt),
                        "dd MMM yyyy, hh:mm a"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      PAYMENT_COLORS[bill.paymentMode] ||
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {bill.paymentMode}
                  </span>
                  <span className="text-base font-bold text-[#0D9488]">
                    ₹{bill.totalAmount.toFixed(2)}
                  </span>
                  {expanded === bill._id ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded internal view */}
              {expanded === bill._id && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">

                  {/* Internal items table WITH batch details */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Items — Internal View (batch details visible only here)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs whitespace-nowrap">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-200">
                            <th className="pb-2 text-left font-semibold">Medicine</th>
                            <th className="pb-2 text-left font-semibold">Batch #</th>
                            <th className="pb-2 text-left font-semibold">Batch ID</th>
                            <th className="pb-2 text-center font-semibold">Qty</th>
                            <th className="pb-2 text-right font-semibold">Unit ₹</th>
                            <th className="pb-2 text-center font-semibold">GST</th>
                            <th className="pb-2 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bill.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-2 font-medium text-slate-900">
                                {item.medicineName}
                              </td>
                              <td className="py-2 font-mono text-[#0D9488] font-semibold">
                                {item.batchNumber}
                              </td>
                              <td className="py-2 font-mono text-slate-400 text-[10px]">
                                {item.batchId}
                              </td>
                              <td className="py-2 text-center text-slate-600">
                                {item.quantitySold}
                              </td>
                              <td className="py-2 text-right text-slate-600">
                                ₹{item.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2 text-center text-slate-500">
                                {item.gstRate}%
                              </td>
                              <td className="py-2 text-right font-semibold text-slate-900">
                                ₹{item.lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-56 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Sub-total</span>
                        <span>₹{bill.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST</span>
                        <span>₹{bill.taxAmount.toFixed(2)}</span>
                      </div>
                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span>
                          <span>-₹{bill.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                        <span>Total</span>
                        <span className="text-[#0D9488]">
                          ₹{bill.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CGHS split internal detail */}
                  {bill.cghsSplit?.enabled && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-xs">
                      <p className="font-semibold text-[#0D9488] mb-2">
                        CGHS Split Billing
                      </p>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Patient ({bill.cghsSplit.patientSharePercent}%)</span>
                        <span className="font-bold">
                          ₹{bill.cghsSplit.patientShareAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>CGHS ({bill.cghsSplit.cghsSharePercent}%)</span>
                        <span className="font-bold">
                          ₹{bill.cghsSplit.cghsShareAmount.toFixed(2)}
                        </span>
                      </div>
                      {bill.cghsSplit.cghsCardNumber && (
                        <p className="text-slate-400 mt-1">
                          Card: {bill.cghsSplit.cghsCardNumber}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Staff + print */}
                  <div className="pt-1 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-400">
                      Processed by {bill.createdBy?.name || "Staff"} ·{" "}
                      {format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")}
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-400">
                        Printed bill hides batch details
                      </p>
                      <button
                        onClick={() => generateBillPDF(bill, shopName)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F766E]"
                      >
                        <Printer className="h-4 w-4" />
                        Generate & Print Bill
                      </button>
                    </div>
                  </div>

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
