import Medicine from "../models/Medicine.js";
import Batch from "../models/Batch.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    List all medicines for the authenticated shop, with
 *          aggregated stock totals from their batches.
 * @route   GET /api/medicines
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getMedicines = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const medicines = await Medicine.find({ shopId }).sort({ name: 1 });

  const medicineIds = medicines.map((m) => m._id);

  // Aggregate total remaining quantity and nearest expiry per medicine
  const stockAgg = await Batch.aggregate([
    {
      $match: {
        shopId,
        medicineId: { $in: medicineIds },
        quantityRemaining: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: "$medicineId",
        totalRemaining: { $sum: "$quantityRemaining" },
        nearestExpiry: { $min: "$expiryDate" },
        batchCount: { $sum: 1 },
      },
    },
  ]);

  const stockMap = {};
  stockAgg.forEach((s) => {
    stockMap[s._id.toString()] = s;
  });

  const enriched = medicines.map((med) => {
    const stock = stockMap[med._id.toString()];
    return {
      ...med.toObject(),
      totalRemaining: stock?.totalRemaining || 0,
      nearestExpiry: stock?.nearestExpiry || null,
      batchCount: stock?.batchCount || 0,
    };
  });

  res.json(enriched);
});

/**
 * @desc    Search medicines by name for the POS terminal (live search).
 * @route   GET /api/medicines/search?q=para
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const searchMedicines = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { q } = req.query;

  const filter = { shopId, isActive: true };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { genericName: { $regex: q, $options: "i" } },
    ];
  }

  const medicines = await Medicine.find(filter).limit(20).sort({ name: 1 });

  const medicineIds = medicines.map((m) => m._id);

  const stockAgg = await Batch.aggregate([
    {
      $match: {
        shopId,
        medicineId: { $in: medicineIds },
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
      },
    },
    {
      $group: {
        _id: "$medicineId",
        totalRemaining: { $sum: "$quantityRemaining" },
        // The earliest-expiring batch's selling price represents the
        // "next to sell" price under FEFO
        nearestExpiry: { $min: "$expiryDate" },
      },
    },
  ]);

  const stockMap = {};
  stockAgg.forEach((s) => {
    stockMap[s._id.toString()] = s;
  });

  // Fetch the FEFO-first batch's price for each medicine
  const results = await Promise.all(
    medicines.map(async (med) => {
      const fefoBatch = await Batch.findOne({
        shopId,
        medicineId: med._id,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
      }).sort({ expiryDate: 1 });

      const stock = stockMap[med._id.toString()];

      return {
        _id: med._id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        unit: med.unit,
        gstRate: med.gstRate,
        schedule: med.schedule,
        totalRemaining: stock?.totalRemaining || 0,
        nearestExpiry: stock?.nearestExpiry || null,
        sellingPrice: fefoBatch?.sellingPrice || 0,
        fefoBatchId: fefoBatch?._id || null,
        fefoBatchNumber: fefoBatch?.batchNumber || null,
      };
    })
  );

  res.json(results);
});

/**
 * @desc    Create a new medicine in the shop's catalog.
 * @route   POST /api/medicines
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const createMedicine = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const medicine = await Medicine.create({
    ...req.body,
    shopId,
  });

  res.status(201).json(medicine);
});

/**
 * @desc    Update a medicine's details.
 * @route   PUT /api/medicines/:id
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const updateMedicine = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const medicine = await Medicine.findOneAndUpdate(
    { _id: req.params.id, shopId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!medicine) {
    res.status(404);
    throw new Error("Medicine not found");
  }

  res.json(medicine);
});

/**
 * @desc    Soft-delete (deactivate) a medicine.
 * @route   DELETE /api/medicines/:id
 * @access  Private (shop_owner)
 */
export const deleteMedicine = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const medicine = await Medicine.findOneAndUpdate(
    { _id: req.params.id, shopId },
    { isActive: false },
    { new: true }
  );

  if (!medicine) {
    res.status(404);
    throw new Error("Medicine not found");
  }

  res.json({ message: "Medicine deactivated" });
});
