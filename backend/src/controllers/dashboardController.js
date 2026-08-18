import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Safe helper to extract shopId and build ObjectId / String query
const getShopMatch = (req) => {
  const rawShop = req.user?.shopId || req.user?.shop || req.user?.id;
  if (!rawShop) return null;

  const shopIdStr = typeof rawShop === "object" ? rawShop._id?.toString() : rawShop.toString();
  if (!shopIdStr || !mongoose.Types.ObjectId.isValid(shopIdStr)) return null;

  const shopObjectId = new mongoose.Types.ObjectId(shopIdStr);
  return { $in: [shopObjectId, shopIdStr] };
};

/**
 * @desc    Main Dashboard KPIs
 * @route   GET /api/dashboard/summary
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const shopMatch = getShopMatch(req);

  if (!shopMatch) {
    return res.status(200).json({
      todaysSales: { totalRevenue: 0, totalTax: 0, billCount: 0 },
      weeklyTrend: [],
      categoryDistribution: [],
      expiringBatches: [],
      expiredCount: 0,
      lowStockItems: [],
      inventoryValue: { totalCostValue: 0, totalSaleValue: 0 },
      totalMedicines: 0,
    });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + NINETY_DAYS_MS);

  // 1. Today's Sales
  const todaysSalesAgg = await Bill.aggregate([
    { $match: { shopId: shopMatch, createdAt: { $gte: startOfToday } } },
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

  // 2. Weekly Trend
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const weeklyTrendAgg = await Bill.aggregate([
    { $match: { shopId: shopMatch, createdAt: { $gte: sevenDaysAgo } } },
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

  // 3. Category Distribution
  const categoryDistribution = await Medicine.aggregate([
    { $match: { shopId: shopMatch, isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  // 4. Expiring Batches
  const expiringBatches = await Batch.find({
    shopId: shopMatch,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $gt: now, $lte: ninetyDaysFromNow },
  })
    .populate("medicineId", "name")
    .sort({ expiryDate: 1 })
    .limit(10);

  const expiredCount = await Batch.countDocuments({
    shopId: shopMatch,
    quantityRemaining: { $gt: 0 },
    expiryDate: { $lt: now },
  });

  // 5. Stock & Low Stock
  const allMedicines = await Medicine.find({ shopId: shopMatch, isActive: true });
  const medicineIds = allMedicines.map((m) => m._id);

  const stockAgg = await Batch.aggregate([
    {
      $match: {
        shopId: shopMatch,
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

  // 6. Inventory Value
  const inventoryValueAgg = await Batch.aggregate([
    { $match: { shopId: shopMatch, quantityRemaining: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalCostValue: {
          $sum: { $multiply: ["$quantityRemaining", { $ifNull: ["$purchasePrice", 0] }] },
        },
        totalSaleValue: {
          $sum: {
            $multiply: [
              "$quantityRemaining",
              { $ifNull: ["$salePrice", { $ifNull: ["$sellingPrice", 0] }] },
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
 * @desc    Extended KPI charts — dealer distribution, monthly medicine purchase, sales YoY
 * @route   GET /api/dashboard/extended
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDashboardExtended = asyncHandler(async (req, res) => {
  const shopMatch = getShopMatch(req);

  if (!shopMatch) {
    return res.json({
      dealerDistribution: [],
      monthlyMedicinePurchase: [],
      monthlySalesComparison: [],
    });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  // 1. Dealer-wise stock distribution
  const dealerDistribution = await Batch.aggregate([
    {
      $match: {
        shopId: shopMatch,
        quantityRemaining: { $gt: 0 },
        dealerId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$dealerId",
        batchCount: { $sum: 1 },
        totalValue: {
          $sum: { $multiply: ["$quantityRemaining", { $ifNull: ["$purchasePrice", 0] }] },
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
        totalValue: { $round: [{ $ifNull: ["$totalValue", 0] }, 2] },
      },
    },
    { $sort: { totalValue: -1 } },
    { $limit: 10 },
  ]);

  // 2. Month-wise medicine purchase quantity (last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyMedicinePurchase = await Batch.aggregate([
    {
      $match: {
        shopId: shopMatch,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalQuantity: { $sum: { $ifNull: ["$quantityReceived", "$quantity"] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // 3. Month-wise sales comparison (current year vs previous year)
  const startOfPreviousYear = new Date(previousYear, 0, 1);

  const allMonthlySales = await Bill.aggregate([
    {
      $match: {
        shopId: shopMatch,
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
    const month = entry._id?.month;
    const year = entry._id?.year;
    if (month && year) {
      if (year === currentYear) {
        salesMap[month].currentYear = entry.revenue || 0;
      } else if (year === previousYear) {
        salesMap[month].previousYear = entry.revenue || 0;
      }
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
