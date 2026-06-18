import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 12,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    billNumber: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      default: "Walk-in Customer",
    },

    customerPhone: {
      type: String,
      default: "",
    },

    items: {
      type: [billItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    subTotal: {
      type: Number,
      required: true,
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "Card", "UPI", "CGHS Split"],
      default: "Cash",
    },

    // Used when paymentMode === 'CGHS Split'
    cghsSplit: {
      enabled: { type: Boolean, default: false },
      patientSharePercent: { type: Number, default: 20 },
      cghsSharePercent: { type: Number, default: 80 },
      patientShareAmount: { type: Number, default: 0 },
      cghsShareAmount: { type: Number, default: 0 },
      cghsCardNumber: { type: String, default: "" },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

billSchema.index({ shopId: 1, createdAt: -1 });

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
