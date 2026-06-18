import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },

    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },

    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },

    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },

    manufactureDate: {
      type: Date,
      default: null,
    },

    quantityReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    quantityRemaining: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    purchasePrice: {
      // cost price per unit
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      // MRP / sale price per unit
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to support the FEFO query efficiently:
// find batches for a given shop+medicine, with stock remaining,
// not expired, sorted by expiry ascending.
batchSchema.index({ shopId: 1, medicineId: 1, expiryDate: 1 });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
