import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Bill from "../models/Bill.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    Global platform metrics for the Central Admin dashboard.
 * @route   GET /api/admin/metrics
 * @access  Private (central_admin)
 */
export const getGlobalMetrics = asyncHandler(async (req, res) => {
  const [totalShops, approvedShops, pendingShops, rejectedShops] = await Promise.all([
    Shop.countDocuments({}),
    Shop.countDocuments({ verificationStatus: "Approved" }),
    Shop.countDocuments({ verificationStatus: "Pending" }),
    Shop.countDocuments({ verificationStatus: "Rejected" }),
  ]);

  const totalUsers = await User.countDocuments({ role: { $ne: "central_admin" } });

  // Aggregate subscription revenue across all approved shops, grouped by tier
  const revenueByTier = await Shop.aggregate([
    { $match: { verificationStatus: "Approved" } },
    {
      $group: {
        _id: "$subscriptionTier",
        count: { $sum: 1 },
        revenue: { $sum: "$subscriptionRevenue" },
      },
    },
  ]);

  const totalMRR = revenueByTier.reduce((sum, tier) => sum + (tier.revenue || 0), 0);

  // Tenant growth over the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tenantGrowth = await Shop.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Platform-wide sales volume (sum of totalAmount across all bills)
  const salesAgg = await Bill.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalBills: { $sum: 1 } } },
  ]);

  const totalPlatformSales = salesAgg[0]?.totalSales || 0;
  const totalPlatformBills = salesAgg[0]?.totalBills || 0;

  res.json({
    tenants: {
      total: totalShops,
      approved: approvedShops,
      pending: pendingShops,
      rejected: rejectedShops,
    },
    users: { total: totalUsers },
    revenue: {
      mrr: totalMRR,
      byTier: revenueByTier,
    },
    tenantGrowth,
    platformSales: {
      totalSales: totalPlatformSales,
      totalBills: totalPlatformBills,
    },
  });
});

/**
 * @desc    Get the verification queue (all shops with Pending status,
 *          oldest first - chronological order).
 * @route   GET /api/admin/verification-queue
 * @access  Private (central_admin)
 */
export const getVerificationQueue = asyncHandler(async (req, res) => {
  const queue = await Shop.find({ verificationStatus: "Pending" }).sort({ createdAt: 1 });
  res.json(queue);
});

/**
 * @desc    List all shops (with optional status filter).
 * @route   GET /api/admin/shops?status=Approved
 * @access  Private (central_admin)
 */
export const getAllShops = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.verificationStatus = req.query.status;
  }
  const shops = await Shop.find(filter).sort({ createdAt: -1 });
  res.json(shops);
});

/**
 * @desc    Approve a pending shop. Sets verificationStatus to 'Approved',
 *          which instantly unlocks the shop's dashboard on the frontend.
 * @route   PATCH /api/admin/shops/:id/approve
 * @access  Private (central_admin)
 */
export const approveShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    res.status(404);
    throw new Error("Shop not found");
  }

  shop.verificationStatus = "Approved";
  shop.rejectionReason = "";

  // Assign a baseline subscription revenue if none set, for MRR tracking
  if (!shop.subscriptionRevenue) {
    const tierRevenue = { Trial: 0, Basic: 999, Pro: 2499, Enterprise: 4999 };
    shop.subscriptionRevenue = tierRevenue[shop.subscriptionTier] ?? 0;
  }

  await shop.save();

  res.json({ message: "Shop approved successfully", shop });
});

/**
 * @desc    Reject a pending shop, with an optional reason.
 * @route   PATCH /api/admin/shops/:id/reject
 * @access  Private (central_admin)
 */
export const rejectShop = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    res.status(404);
    throw new Error("Shop not found");
  }

  shop.verificationStatus = "Rejected";
  shop.rejectionReason = reason || "Submitted documents did not meet verification standards.";

  await shop.save();

  res.json({ message: "Shop rejected", shop });
});

/**
 * @desc    Update a shop's subscription tier (revenue management).
 * @route   PATCH /api/admin/shops/:id/subscription
 * @access  Private (central_admin)
 */
export const updateShopSubscription = asyncHandler(async (req, res) => {
  const { subscriptionTier, subscriptionRevenue } = req.body;

  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    res.status(404);
    throw new Error("Shop not found");
  }

  if (subscriptionTier) shop.subscriptionTier = subscriptionTier;
  if (typeof subscriptionRevenue === "number") shop.subscriptionRevenue = subscriptionRevenue;

  await shop.save();

  res.json({ message: "Subscription updated", shop });
});
