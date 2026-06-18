import Bill from "../models/Bill.js";
import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * @desc    Main Dashboard KPIs - today's turnover, product distribution,
 *          and near-expiry inventory alerts.
 * @route   GET /api/dashboard/summary
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);

  // --- Today's financial turnover ---
  const todaysSalesAgg = await Bill.aggregate([
    { $match: { shopId, createdAt: { $gte: startOfToday } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalTax: { $sum: "$taxAmount" },
        billCount: { $sum: 1 },
      },
    },
  ]);

  const todaysSales = todaysSalesAgg[0] || { totalRevenue: 0, totalTax: 0, billCount: 0 };

  // --- 7-day revenue trend (for line graph) ---
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const weeklyTrendAgg = await Bill.aggregate([
    { $match: { shopId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // --- Product distribution by category ---
  const categoryDistribution = await Medicine.aggregate([
    { $match: { shopId, isActive: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  // --- Near-expiry inventory alerts (within 90 days) ---
  const expiringBatches = await Batch.find({
    shopId,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
  })
    .populate("medicineId", "name")
    .sort({ expiryDate: 1 })
    .limit(10);

  // --- Expired (dead stock) count ---
  const expiredCount = await Batch.countDocuments({
    shopId,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $lt: now },
  });

  // --- Low stock alerts ---
  const allMedicines = await Medicine.find({ shopId, isActive: true });
  const medicineIds = allMedicines.map((m) => m._id);

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

  const lowStockItems = allMedicines
    .map((m) => ({
      _id: m._id,
      name: m.name,
      reorderLevel: m.reorderLevel,
      currentStock: stockMap[m._id.toString()] || 0,
    }))
    .filter((m) => m.currentStock <= m.reorderLevel)
    .slice(0, 10);

  // --- Total inventory value ---
  const inventoryValueAgg = await Batch.aggregate([
    { $match: { shopId, quantityRemaining: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalCostValue: { $sum: { $multiply: ["$quantityRemaining", "$purchasePrice"] } },
        totalSaleValue: { $sum: { $multiply: ["$quantityRemaining", "$sellingPrice"] } },
      },
    },
  ]);

  const inventoryValue = inventoryValueAgg[0] || { totalCostValue: 0, totalSaleValue: 0 };

  res.json({
    todaysSales,
    weeklyTrend: weeklyTrendAgg,
    categoryDistribution,
    expiringBatches,
    expiredCount,
    lowStockItems,
    inventoryValue,
    totalMedicines: allMedicines.length,
  });
});
