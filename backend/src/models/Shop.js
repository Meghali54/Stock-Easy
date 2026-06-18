import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    // Business & Legal Data
    drugLicenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    panNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gstin: {
      type: String,
      required: true,
      trim: true,
    },

    // Verification documents - populated from real file uploads via
    // multer (see uploadMiddleware.js). `url` is a relative path served
    // statically by the backend (e.g. /uploads/shop-documents/xyz.pdf).
    documents: {
      drugLicenseDoc: {
        fileName: { type: String, default: "" },
        url: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        uploaded: { type: Boolean, default: false },
      },
      panCardDoc: {
        fileName: { type: String, default: "" },
        url: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        uploaded: { type: Boolean, default: false },
      },
      gstCertificateDoc: {
        fileName: { type: String, default: "" },
        url: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        uploaded: { type: Boolean, default: false },
      },
      shopPhotoDoc: {
        fileName: { type: String, default: "" },
        url: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        uploaded: { type: Boolean, default: false },
      },
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    subscriptionTier: {
      type: String,
      enum: ["Trial", "Basic", "Pro", "Enterprise"],
      default: "Trial",
    },

    subscriptionRevenue: {
      // Monthly recurring revenue contributed by this shop, used for
      // the Central Admin global revenue trackers.
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
