import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, Upload, X, FileText } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  { label: "Owner Details", description: "Personal information" },
  { label: "Business & Legal", description: "Licensing and tax data" },
  { label: "Documents", description: "Upload verification files" },
  { label: "Confirmation", description: "Review and submit" },
];

const DOCUMENT_FIELDS = [
  { field: "drugLicenseDoc", label: "Drug License Certificate" },
  { field: "panCardDoc", label: "PAN Card" },
  { field: "gstCertificateDoc", label: "GST Registration Certificate" },
  { field: "shopPhotoDoc", label: "Shop Front Photo" },
] as const;

type DocField = (typeof DOCUMENT_FIELDS)[number]["field"];

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  const [form, setForm] = useState({
    ownerName: user?.name || "",
    phone: "",
    shopName: "",
    drugLicenseNumber: "",
    panNumber: "",
    gstin: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Real File objects selected from the device, keyed by document field
  const [files, setFiles] = useState<Partial<Record<DocField, File>>>({});
  // Object URLs for instant image previews (revoked on replace/unmount)
  const [previews, setPreviews] = useState<Partial<Record<DocField, string>>>({});

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleFileSelect = (field: DocField, fileList: FileList | null) => {
    setFileError("");
    const file = fileList?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`${file.name}: only JPG, PNG, WEBP or PDF files are allowed.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`${file.name}: file is larger than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Revoke any previous preview URL for this field to avoid leaking memory
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]!);
      return { ...prev, [field]: file.type === "application/pdf" ? "" : URL.createObjectURL(file) };
    });
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const removeFile = (field: DocField) => {
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]!);
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFiles((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const canProceed = () => {
    if (step === 0) return form.ownerName && form.phone;
    if (step === 1) return form.shopName && form.drugLicenseNumber && form.panNumber && form.gstin;
    if (step === 2) return true; // docs are recommended but not hard-blocked
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      // multipart/form-data so the backend's multer middleware can
      // receive both the text fields and the actual file bytes in one
      // request. Field names here must match uploadShopDocuments'
      // .fields() config on the backend exactly.
      const formData = new FormData();
      formData.append("ownerName", form.ownerName);
      formData.append("phone", form.phone);
      formData.append("shopName", form.shopName);
      formData.append("drugLicenseNumber", form.drugLicenseNumber);
      formData.append("panNumber", form.panNumber);
      formData.append("gstin", form.gstin);
      formData.append("addressLine1", form.addressLine1);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("pincode", form.pincode);

      DOCUMENT_FIELDS.forEach(({ field }) => {
        const file = files[field];
        if (file) formData.append(field, file);
      });

      const { data } = await api.post("/auth/onboarding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the token and user with new shopId
      login(data.token, { ...user!, shopId: data.shop._id }, data.shop);
      navigate("/pending");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-graphite-900">Register Your Pharmacy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete the 4-step verification process to get started
          </p>
        </div>

        {/* Step progress */}
        <div className="mb-8 flex items-start justify-between">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    i < step
                      ? "border-teal bg-teal text-white"
                      : i === step
                      ? "border-teal bg-white text-teal"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {i < step ? <CheckCircle className="h-4.5 w-4.5" /> : i + 1}
                </div>
                <p className={`text-xs font-medium ${i === step ? "text-teal" : "text-slate-400"}`}>
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mt-4 h-0.5 flex-1 mx-2 transition-colors ${i < step ? "bg-teal" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm animate-fade-in">
          <h2 className="mb-6 text-lg font-bold text-graphite-900">{STEPS[step].label}</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Step 0 - Owner Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label-field">Full Name *</label>
                <input className="input-field" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Dr. Priya Sharma" />
              </div>
              <div>
                <label className="label-field">Phone Number *</label>
                <input className="input-field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>
          )}

          {/* Step 1 - Business & Legal */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label-field">Pharmacy / Shop Name *</label>
                <input className="input-field" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} placeholder="City Medical & General Stores" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Drug License Number *</label>
                  <input className="input-field" value={form.drugLicenseNumber} onChange={(e) => set("drugLicenseNumber", e.target.value)} placeholder="DL-MH-12345" />
                </div>
                <div>
                  <label className="label-field">PAN Number *</label>
                  <input className="input-field" value={form.panNumber} onChange={(e) => set("panNumber", e.target.value)} placeholder="ABCDE1234F" />
                </div>
              </div>
              <div>
                <label className="label-field">GSTIN *</label>
                <input className="input-field" value={form.gstin} onChange={(e) => set("gstin", e.target.value)} placeholder="27ABCDE1234F1Z5" />
              </div>
              <div>
                <label className="label-field">Shop Address</label>
                <input className="input-field mb-2" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Shop No. 5, Main Market" />
                <div className="grid grid-cols-3 gap-2">
                  <input className="input-field" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
                  <input className="input-field" value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
                  <input className="input-field" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="Pincode" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Document Uploads */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Upload clear scanned copies of the following documents from your device. Accepted formats: JPG, PNG,
                WEBP, PDF. Maximum file size: {MAX_FILE_SIZE_MB}MB each.
              </p>

              {fileError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                  {fileError}
                </div>
              )}

              {DOCUMENT_FIELDS.map(({ field, label }) => {
                const file = files[field];
                const preview = previews[field];
                const inputId = `file-input-${field}`;

                return (
                  <div key={field} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail / icon */}
                        {preview ? (
                          <img
                            src={preview}
                            alt={label}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : file ? (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-50 border border-rose-100">
                            <FileText className="h-5 w-5 text-rose-400" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Upload className="h-5 w-5 text-slate-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-graphite-900">{label}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {file ? file.name : "No file selected"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file && (
                          <button
                            type="button"
                            onClick={() => removeFile(field)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-500"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <label
                          htmlFor={inputId}
                          className={`btn-secondary !py-1.5 !px-3 text-xs gap-1.5 cursor-pointer ${
                            file ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50" : ""
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {file ? "Replace" : "Upload"}
                        </label>
                        <input
                          id={inputId}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileSelect(field, e.target.files)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3 - Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                {[
                  { label: "Owner Name", value: form.ownerName },
                  { label: "Phone", value: form.phone },
                  { label: "Shop Name", value: form.shopName },
                  { label: "Drug License", value: form.drugLicenseNumber },
                  { label: "PAN", value: form.panNumber },
                  { label: "GSTIN", value: form.gstin },
                  { label: "City", value: `${form.city}, ${form.state} - ${form.pincode}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">{label}</span>
                    <span className="font-semibold text-graphite-900">{value || "—"}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Documents Attached
                </p>
                {DOCUMENT_FIELDS.map(({ field, label }) => {
                  const file = files[field];
                  return (
                    <div key={field} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      {file ? (
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {file.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not attached</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <strong>Note:</strong> After submission, your application will be reviewed by our compliance team. You'll
                have access to the full dashboard once approved.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="btn-secondary gap-2 disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
