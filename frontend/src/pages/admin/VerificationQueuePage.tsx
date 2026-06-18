import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Loader2, FileText, ExternalLink, X } from "lucide-react";
import api, { API_BASE_URL } from "../../services/api";
import { VerificationBadge } from "../../components/Badges";
import { format } from "date-fns";

interface ShopDocument {
  fileName: string;
  url: string;
  mimeType: string;
  uploaded: boolean;
}

interface Shop {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  drugLicenseNumber: string;
  panNumber: string;
  gstin: string;
  verificationStatus: string;
  subscriptionTier: string;
  createdAt: string;
  rejectionReason?: string;
  documents?: {
    drugLicenseDoc?: ShopDocument;
    panCardDoc?: ShopDocument;
    gstCertificateDoc?: ShopDocument;
    shopPhotoDoc?: ShopDocument;
  };
}

// The backend serves uploaded files as static assets at the API origin
// (e.g. http://localhost:5000/uploads/shop-documents/...), so we strip
// the "/api" suffix from the configured API base to get the file origin.
const FILE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const DOCUMENT_LABELS: { key: keyof NonNullable<Shop["documents"]>; label: string }[] = [
  { key: "drugLicenseDoc", label: "Drug License" },
  { key: "panCardDoc", label: "PAN Card" },
  { key: "gstCertificateDoc", label: "GST Certificate" },
  { key: "shopPhotoDoc", label: "Shop Photo" },
];

const VerificationQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; label: string; mimeType: string } | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/admin/verification-queue");
    setQueue(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await api.patch(`/admin/shops/${id}/approve`);
      setQueue((q) => q.filter((s) => s._id !== id));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActioningId(rejectTarget);
    try {
      await api.patch(`/admin/shops/${rejectTarget}/reject`, { reason: rejectReason });
      setQueue((q) => q.filter((s) => s._id !== rejectTarget));
    } finally {
      setActioningId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-semibold text-slate-600">
            {queue.length} application{queue.length !== 1 ? "s" : ""} pending review
          </span>
        </div>
        <button onClick={fetchQueue} className="btn-secondary gap-2 !py-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="text-base font-semibold text-graphite-900">Verification queue is clear</p>
          <p className="mt-1 text-sm text-slate-400">All applications have been processed.</p>
        </div>
      )}

      <div className="space-y-3">
        {queue.map((shop) => (
          <div key={shop._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
            {/* Header row */}
            <div
              className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-slate-50"
              onClick={() => setExpanded(expanded === shop._id ? null : shop._id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-base font-bold text-amber-700">
                  {shop.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-graphite-900">{shop.name}</p>
                  <p className="text-xs text-slate-500">{shop.ownerName} · {shop.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-400 sm:block">
                  {format(new Date(shop.createdAt), "dd MMM yyyy")}
                </span>
                <VerificationBadge status={shop.verificationStatus} />
                {expanded === shop._id ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === shop._id && (
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-3 text-sm mb-5">
                  {[
                    { label: "Drug License", value: shop.drugLicenseNumber },
                    { label: "PAN Number", value: shop.panNumber },
                    { label: "GSTIN", value: shop.gstin },
                    { label: "Phone", value: shop.phone },
                    { label: "Submitted", value: format(new Date(shop.createdAt), "dd MMM yyyy, hh:mm a") },
                    { label: "Subscription", value: shop.subscriptionTier },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-slate-400">{label}</p>
                      <p className="font-semibold text-graphite-900">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Uploaded verification documents */}
                <div className="mb-5">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Uploaded Documents
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {DOCUMENT_LABELS.map(({ key, label }) => {
                      const doc = shop.documents?.[key];
                      const fullUrl = doc?.url ? `${FILE_ORIGIN}${doc.url}` : null;
                      const isImage = doc?.mimeType?.startsWith("image/");
                      const isPdf = doc?.mimeType === "application/pdf";

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!fullUrl}
                          onClick={() => fullUrl && setLightbox({ url: fullUrl, label, mimeType: doc!.mimeType })}
                          className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                            fullUrl
                              ? "border-slate-200 bg-white hover:border-teal cursor-pointer"
                              : "border-dashed border-slate-200 bg-slate-50 cursor-default"
                          }`}
                        >
                          <div className="flex h-24 items-center justify-center bg-slate-100">
                            {fullUrl && isImage ? (
                              <img src={fullUrl} alt={label} className="h-full w-full object-cover" />
                            ) : fullUrl && isPdf ? (
                              <FileText className="h-8 w-8 text-rose-400" />
                            ) : (
                              <span className="text-xs text-slate-400">Not uploaded</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1.5 px-2.5 py-2">
                            <span className="truncate text-xs font-medium text-slate-600">{label}</span>
                            {fullUrl && (
                              <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-teal" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(shop._id)}
                    disabled={actioningId === shop._id}
                    className="btn-primary gap-2"
                  >
                    {actioningId === shop._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(shop._id)}
                    className="btn-danger gap-2"
                    disabled={actioningId === shop._id}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-graphite-900">Reject Application</h3>
            <p className="mt-1 text-sm text-slate-500">
              Provide a reason so the applicant understands what to correct.
            </p>
            <textarea
              className="input-field mt-4 min-h-[100px] resize-y"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Drug license document is not clearly visible. Please resubmit."
            />
            <div className="mt-4 flex gap-3">
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="btn-danger flex-1">
                {actioningId ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirm Rejection"}
              </button>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document lightbox - full-size image preview or PDF open link */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-graphite-900">{lightbox.label}</p>
              <div className="flex items-center gap-2">
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-1.5 !px-3 text-xs gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Original
                </a>
                <button
                  onClick={() => setLightbox(null)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {lightbox.mimeType === "application/pdf" ? (
              <iframe src={lightbox.url} title={lightbox.label} className="h-[70vh] w-full rounded-xl border border-slate-200" />
            ) : (
              <img src={lightbox.url} alt={lightbox.label} className="max-h-[70vh] w-full rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationQueuePage;
