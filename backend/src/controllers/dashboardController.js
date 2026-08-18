import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * @desc    Main Dashboard KPIs
 * @route   GET /api/dashboard/summary
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  // Convert string shopId to mongoose ObjectId for Aggregation pipelines
  const shopId = new mongoose.Types.ObjectId(req.user.shopId);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);

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

  const todaysSales = todaysSalesAgg[0] || {
    totalRevenue: 0,
    totalTax: 0,
    billCount: 0,
  };

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

  const categoryDistribution = await Medicine.aggregate([
    { $match: { shopId, isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const expiringBatches = await Batch.find({
    shopId,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
  })
    .populate("medicineId", "name")
    .sort({ expiryDate: 1 })
    .limit(10);

  const expiredCount = await Batch.countDocuments({
    shopId,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $lt: now },
  });

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

  const inventoryValueAgg = await Batch.aggregate([
    { $match: { shopId, quantityRemaining: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalCostValue: {
          $sum: { $multiply: ["$quantityRemaining", "$purchasePrice"] },
        },
        totalSaleValue: {
          // Handles either salePrice or sellingPrice field fallback
          $sum: {
            $multiply: [
              "$quantityRemaining",
              { $ifNull: ["$salePrice", "$sellingPrice"] },
            ],
          },
        },
      },
    },
  ]);

  const inventoryValue = inventoryValueAgg[0] || {
    totalCostValue: 0,
    totalSaleValue: 0,
  };

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

/**
 * @desc    Extended KPI charts — dealer distribution, monthly medicine
 *          purchase quantities, month-wise sales year-over-year comparison
 * @route   GET /api/dashboard/extended
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDashboardExtended = asyncHandler(async (req, res) => {
  const shopId = new mongoose.Types.ObjectId(req.user.shopId);
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  // 1. Dealer-wise stock distribution
  const dealerDistribution = await Batch.aggregate([
    {
      $match: {
        shopId,
        quantityRemaining: { $gt: 0 },
        dealerId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$dealerId",
        batchCount: { $sum: 1 },
        totalValue: {
          $sum: { $multiply: ["$quantityRemaining", "$purchasePrice"] },
        },
      },
    },
    {
      $lookup: {
        from: "dealers",
        localField: "_id",
        foreignField: "_id",
        as: "dealer",
      },
    },
    { $unwind: { path: "$dealer", preserveNullAndEmpty: true } },
    {
      $project: {
        dealerName: { $ifNull: ["$dealer.name", "Unknown Dealer"] },
        batchCount: 1,
        totalValue: { $round: ["$totalValue", 2] },
      },
    },
    { $sort: { totalValue: -1 } },
    { $limit: 10 },
  ]);

  // 2. Month-wise medicine purchase quantity (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyMedicinePurchase = await Batch.aggregate([
    {
      $match: {
        shopId,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalQuantity: { $sum: "$quantityReceived" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // 3. Month-wise sales comparison (current year vs previous year)
  const startOfPreviousYear = new Date(`${previousYear}-01-01T00:00:00.000Z`);

  const allMonthlySales = await Bill.aggregate([
    {
      $match: {
        shopId,
        createdAt: { $gte: startOfPreviousYear },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Reshape into { month, currentYear, previousYear }
  const salesMap = {};
  for (let m = 1; m <= 12; m++) {
    salesMap[m] = { currentYear: 0, previousYear: 0 };
  }
  allMonthlySales.forEach((entry) => {
    const month = entry._id.month;
    if (entry._id.year === currentYear) {
      salesMap[month].currentYear = entry.revenue;
    } else if (entry._id.year === previousYear) {
      salesMap[month].previousYear = entry.revenue;
    }
  });

  const currentMonth = now.getMonth() + 1;
  const monthlySalesComparison = Object.entries(salesMap)
    .filter(([month]) => parseInt(month) <= currentMonth)
    .map(([month, values]) => ({
      month: parseInt(month),
      currentYear: values.currentYear,
      previousYear: values.previousYear,
    }));

  res.json({
    dealerDistribution,
    monthlyMedicinePurchase,
    monthlySalesComparison,
  });
});
