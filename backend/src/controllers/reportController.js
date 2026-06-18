import Bill from "../models/Bill.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    Sales analytics report for a given date range, including
 *          revenue trend, top-selling medicines, and payment mode split.
 * @route   GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getSalesReport = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(new Date().getDate() - 30));
  const to = req.query.to ? new Date(req.query.to) : new Date();
  to.setHours(23, 59, 59, 999);

  const match = { shopId, createdAt: { $gte: from, $lte: to } };

  // Daily revenue trend
  const dailyTrend = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        tax: { $sum: "$taxAmount" },
        bills: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Top selling medicines by quantity
  const topMedicines = await Bill.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.medicineId",
        name: { $first: "$items.medicineName" },
        totalQuantity: { $sum: "$items.quantitySold" },
        totalRevenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  // Payment mode breakdown
  const paymentBreakdown = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$paymentMode",
        count: { $sum: 1 },
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  // Overall totals
  const totalsAgg = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalTax: { $sum: "$taxAmount" },
        totalBills: { $sum: 1 },
        totalDiscount: { $sum: "$discountAmount" },
      },
    },
  ]);

  res.json({
    range: { from, to },
    totals: totalsAgg[0] || { totalRevenue: 0, totalTax: 0, totalBills: 0, totalDiscount: 0 },
    dailyTrend,
    topMedicines,
    paymentBreakdown,
  });
});
