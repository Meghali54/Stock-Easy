import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    prompt: {
      type: String,
      required: true,
    },

    response: {
      type: String,
      required: true,
    },

    // What kind of context the assistant pulled to answer
    // (e.g. 'inventory', 'sales', 'expiry', 'general')
    contextType: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true }
);

aiLogSchema.index({ shopId: 1, createdAt: -1 });

const AiLog = mongoose.model("AiLog", aiLogSchema);

export default AiLog;
