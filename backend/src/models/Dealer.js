import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
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

    contactPerson: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },

    gstin: {
      type: String,
      default: "",
    },

    outstandingBalance: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

dealerSchema.index({ shopId: 1, name: 1 });

const Dealer = mongoose.model("Dealer", dealerSchema);

export default Dealer;
