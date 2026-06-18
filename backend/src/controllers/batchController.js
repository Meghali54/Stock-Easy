import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * @desc    Inventory Overview Ledger - returns batches for the shop,
 *          filterable by category tab:
 *            - all          -> every batch with quantityRemaining > 0
 *            - expiring     -> expiryDate within next 90 days (and not yet expired)
 *            - out_of_stock -> quantityRemaining === 0
 *            - dead_stock   -> quantityRemaining > 0 but expiryDate < today
 *                               (expired but never sold off)
 * @route   GET /api/batches?filter=all|expiring|out_of_stock|dead_stock
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getBatches = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { filter = "all" } = req.query;

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);

  let query = { shopId };

  switch (filter) {
    case "expiring":
      query = {
        shopId,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
      };
      break;
    case "out_of_stock":
      query = { shopId, quantityRemaining: 0 };
      break;
    case "dead_stock":
      query = {
        shopId,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $lt: now },
      };
      break;
    case "all":
    default:
      query = { shopId, quantityRemaining: { $gt: 0 } };
      break;
  }

  const batches = await Batch.find(query)
    .populate("medicineId", "name genericName category unit")
    .populate("dealerId", "name")
    .sort({ expiryDate: 1 });

  // Tag each batch with a status flag the frontend can use for badges
  const enriched = batches.map((b) => {
    const obj = b.toObject();
    const expiry = new Date(b.expiryDate);

    let status = "ok";
    if (expiry < now) status = "expired";
    else if (expiry <= ninetyDaysFromNow) status = "expiring_soon";
    if (b.quantityRemaining === 0) status = "out_of_stock";

    return { ...obj, status };
  });

  res.json(enriched);
});

/**
 * @desc    Summary counts for each ledger tab (used for tab badges).
 * @route   GET /api/batches/summary
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getBatchSummary = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);

  const [all, expiring, outOfStock, deadStock] = await Promise.all([
    Batch.countDocuments({ shopId, quantityRemaining: { $gt: 0 } }),
    Batch.countDocuments({
      shopId,
      quantityRemaining: { $gt: 0 },
      expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
    }),
    Batch.countDocuments({ shopId, quantityRemaining: 0 }),
    Batch.countDocuments({
      shopId,
      quantityRemaining: { $gt: 0 },
      expiryDate: { $lt: now },
    }),
  ]);

  res.json({ all, expiring, outOfStock, deadStock });
});

/**
 * @desc    Add a new stock batch (purchase entry / GRN).
 * @route   POST /api/batches
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const createBatch = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const { medicineId } = req.body;

  const medicine = await Medicine.findOne({ _id: medicineId, shopId });
  if (!medicine) {
    res.status(404);
    throw new Error("Medicine not found in this shop's catalog");
  }

  const batch = await Batch.create({
    ...req.body,
    shopId,
    quantityRemaining: req.body.quantityReceived,
  });

  res.status(201).json(batch);
});

/**
 * @desc    Update a batch (e.g. correct price, quantity, expiry).
 * @route   PUT /api/batches/:id
 * @access  Private (shop_owner)
 */
export const updateBatch = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.id, shopId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!batch) {
    res.status(404);
    throw new Error("Batch not found");
  }

  res.json(batch);
});

/**
 * @desc    Delete a batch (e.g. write-off dead stock).
 * @route   DELETE /api/batches/:id
 * @access  Private (shop_owner)
 */
export const deleteBatch = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const batch = await Batch.findOneAndDelete({ _id: req.params.id, shopId });

  if (!batch) {
    res.status(404);
    throw new Error("Batch not found");
  }

  res.json({ message: "Batch removed" });
});
