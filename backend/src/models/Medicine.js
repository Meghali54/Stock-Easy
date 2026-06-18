import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    genericName: {
      type: String,
      default: "",
      trim: true,
    },

    manufacturer: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Ointment",
        "Drops",
        "Inhaler",
        "Device",
        "Other",
      ],
      default: "Tablet",
    },

    hsnCode: {
      type: String,
      default: "",
    },

    gstRate: {
      // percentage, e.g. 5, 12, 18
      type: Number,
      default: 12,
    },

    schedule: {
      // Drug schedule classification (e.g. Schedule H, H1, X, OTC)
      type: String,
      enum: ["OTC", "H", "H1", "X", "G"],
      default: "OTC",
    },

    unit: {
      type: String,
      default: "strip", // strip, bottle, vial, box, piece
    },

    reorderLevel: {
      // Minimum total quantity (across batches) before low-stock alert
      type: Number,
      default: 10,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ shopId: 1, name: 1 });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
