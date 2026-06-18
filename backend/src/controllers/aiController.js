import AiLog from "../models/AiLog.js";
import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import Bill from "../models/Bill.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Searches the shop's medicine catalog for a name mentioned in the
 * prompt. Tries, in order: exact full-name substring match, generic
 * name substring match, then a loose first-word match (e.g. "paracetamol"
 * matches "Paracetamol 500mg"). Returns the best match or null.
 */
const findMentionedMedicine = (medicines, lower) => {
  // Pass 1: full name or generic name appears verbatim in the prompt
  let match = medicines.find((m) => {
    const nameLower = m.name.toLowerCase();
    const genericLower = (m.genericName || "").toLowerCase();
    return lower.includes(nameLower) || (genericLower && lower.includes(genericLower));
  });
  if (match) return match;

  // Pass 2: loose match on the first significant word of the name
  // (e.g. "Paracetamol" from "Paracetamol 500mg"), guarding against
  // very short words that would cause false positives.
  match = medicines.find((m) => {
    const firstWord = m.name.toLowerCase().split(" ")[0];
    return firstWord.length > 3 && lower.includes(firstWord);
  });
  return match || null;
};

/**
 * Builds a full stock answer for a single matched medicine: total
 * remaining quantity across all live batches, plus a per-batch
 * breakdown (batch number, quantity, expiry, price).
 */
const buildStockAnswer = async (shopId, medicine, now) => {
  const batches = await Batch.find({
    shopId,
    medicineId: medicine._id,
    quantityRemaining: { $gt: 0 },
  }).sort({ expiryDate: 1 });

  const totalStock = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);

  if (totalStock === 0) {
    return `${medicine.name} is currently out of stock. Reorder level is set at ${medicine.reorderLevel} ${medicine.unit}s.`;
  }

  const batchLines = batches
    .slice(0, 5)
    .map((b) => {
      const expiry = new Date(b.expiryDate);
      const expired = expiry < now;
      const expiryLabel = expired
        ? "EXPIRED"
        : `expires ${expiry.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
      return `• Batch ${b.batchNumber}: ${b.quantityRemaining} ${medicine.unit}s, ${expiryLabel}, ₹${b.sellingPrice.toFixed(2)}/${medicine.unit}`;
    })
    .join("\n");

  const stockNote =
    totalStock <= medicine.reorderLevel
      ? ` This is at or below your reorder level of ${medicine.reorderLevel}.`
      : "";

  return `${medicine.name} — current stock: ${totalStock} ${medicine.unit}s across ${batches.length} batch(es).${stockNote}\n\n${batchLines}`;
};

/**
 * The Stock Easy AI Assistant is a lightweight, rule-based engine that
 * answers natural-language questions by querying the shop's own live
 * data (inventory, expiry, sales). This keeps the assistant fully
 * functional out-of-the-box without requiring an external LLM API key.
 *
 * To upgrade to a full LLM-powered assistant later, swap the body of
 * `generateResponse()` for a call to your preferred AI provider, passing
 * the same `context` object as grounding data / RAG context.
 */
const generateResponse = async (shopId, prompt) => {
  const lower = prompt.toLowerCase();
  const now = new Date();

  // --- Specific medicine stock lookup ---
  // Matches questions like "current stock of paracetamol 500mg",
  // "how much amoxicillin do I have", "do I have metformin in stock",
  // "quantity of azithromycin left".
  const stockLookupTriggers = [
    "stock of", "how much", "do i have", "quantity of", "units of", "left of", "how many",
  ];
  const mentionsGenericStockWord =
    lower.includes("stock") && !lower.includes("low stock") && !lower.includes("out of stock");
  const looksLikeStockLookup = stockLookupTriggers.some((t) => lower.includes(t)) || mentionsGenericStockWord;

  if (looksLikeStockLookup) {
    const allMedicines = await Medicine.find({ shopId, isActive: true });
    const matched = findMentionedMedicine(allMedicines, lower);

    if (matched) {
      const response = await buildStockAnswer(shopId, matched, now);
      return { response, contextType: "inventory" };
    }

    // Mentioned a stock-lookup phrase but couldn't match a specific
    // medicine name - tell the user clearly instead of falling through
    // to the generic catch-all message.
    if (stockLookupTriggers.some((t) => lower.includes(t))) {
      return {
        response:
          "I couldn't find a medicine matching that name in your catalog. Try using the exact name as it appears in your Medicine Catalog page, or check the Inventory Ledger for the full list.",
        contextType: "inventory",
      };
    }
  }

  // --- Expiry-related questions ---
  if (lower.includes("expir") || lower.includes("near expiry")) {
    const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);
    const expiring = await Batch.find({
      shopId,
      quantityRemaining: { $gt: 0 },
      expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
    })
      .populate("medicineId", "name")
      .sort({ expiryDate: 1 })
      .limit(5);

    if (expiring.length === 0) {
      return {
        response: "Good news — no batches are expiring within the next 90 days.",
        contextType: "expiry",
      };
    }

    const lines = expiring.map((b) => {
      const days = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return `• ${b.medicineId?.name || "Unknown"} (Batch ${b.batchNumber}) — ${b.quantityRemaining} units, expires in ${days} day(s)`;
    });

    return {
      response: `Here are the items closest to expiry:\n${lines.join("\n")}`,
      contextType: "expiry",
    };
  }

  // --- Sales / revenue questions ---
  if (lower.includes("sale") || lower.includes("revenue") || lower.includes("turnover")) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysSalesAgg = await Bill.aggregate([
      { $match: { shopId, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);

    const todays = todaysSalesAgg[0] || { total: 0, count: 0 };

    return {
      response: `Today's turnover so far is ₹${todays.total.toFixed(2)} across ${todays.count} bill(s).`,
      contextType: "sales",
    };
  }

  // --- Low stock / reorder questions ---
  if (lower.includes("low stock") || lower.includes("reorder") || lower.includes("out of stock")) {
    const medicines = await Medicine.find({ shopId, isActive: true });
    const medicineIds = medicines.map((m) => m._id);

    const stockAgg = await Batch.aggregate([
      {
        $match: {
          shopId,
          medicineId: { $in: medicineIds },
          quantityRemaining: { $gt: 0 },
          expiryDate: { $gt: now },
        },
      },
      { $group: { _id: "$medicineId", total: { $sum: "$quantityRemaining" } } },
    ]);

    const stockMap = {};
    stockAgg.forEach((s) => (stockMap[s._id.toString()] = s.total));

    const low = medicines
      .map((m) => ({ name: m.name, stock: stockMap[m._id.toString()] || 0, reorder: m.reorderLevel }))
      .filter((m) => m.stock <= m.reorder);

    if (low.length === 0) {
      return {
        response: "All medicines are currently above their reorder level. No action needed.",
        contextType: "inventory",
      };
    }

    const lines = low.slice(0, 8).map((m) => `• ${m.name}: ${m.stock} left (reorder at ${m.reorder})`);

    return {
      response: `These items are at or below their reorder level:\n${lines.join("\n")}`,
      contextType: "inventory",
    };
  }

  // --- Last-resort: check if any medicine name appears anywhere in the prompt ---
  // Catches phrasings that didn't match any keyword above, e.g. just
  // "Paracetamol?" or "tell me about Azithromycin".
  const allMedicines = await Medicine.find({ shopId, isActive: true });
  const fallbackMatch = findMentionedMedicine(allMedicines, lower);

  if (fallbackMatch) {
    const response = await buildStockAnswer(shopId, fallbackMatch, now);
    return { response, contextType: "inventory" };
  }

  // --- Default / general response ---
  return {
    response:
      "I can help with questions about specific medicines (e.g. \"current stock of Paracetamol 500mg\"), near-expiry stock, today's sales, and low-stock alerts. Try asking things like \"What's expiring soon?\", \"How are today's sales?\", or \"What's low on stock?\"",
    contextType: "general",
  };
};

/**
 * @desc    Ask the Stock Easy AI Assistant a question. Grounds its
 *          answer in the shop's live MongoDB data and logs the
 *          interaction.
 * @route   POST /api/ai/ask
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const askAssistant = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const userId = req.user._id;
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    res.status(400);
    throw new Error("A prompt is required");
  }

  const { response, contextType } = await generateResponse(shopId, prompt);

  await AiLog.create({ shopId, userId, prompt, response, contextType });

  res.json({ response, contextType });
});

/**
 * @desc    Get recent AI assistant conversation history for this shop.
 * @route   GET /api/ai/history
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getAssistantHistory = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const history = await AiLog.find({ shopId }).sort({ createdAt: -1 }).limit(20);

  res.json(history.reverse());
});
