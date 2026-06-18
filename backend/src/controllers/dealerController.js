import Dealer from "../models/Dealer.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    List all dealers/suppliers for the shop.
 * @route   GET /api/dealers
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getDealers = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const dealers = await Dealer.find({ shopId }).sort({ name: 1 });
  res.json(dealers);
});

/**
 * @desc    Create a new dealer/supplier.
 * @route   POST /api/dealers
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const createDealer = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const dealer = await Dealer.create({ ...req.body, shopId });
  res.status(201).json(dealer);
});

/**
 * @desc    Update a dealer's details.
 * @route   PUT /api/dealers/:id
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const updateDealer = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const dealer = await Dealer.findOneAndUpdate({ _id: req.params.id, shopId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!dealer) {
    res.status(404);
    throw new Error("Dealer not found");
  }

  res.json(dealer);
});

/**
 * @desc    Delete a dealer.
 * @route   DELETE /api/dealers/:id
 * @access  Private (shop_owner)
 */
export const deleteDealer = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const dealer = await Dealer.findOneAndDelete({ _id: req.params.id, shopId });

  if (!dealer) {
    res.status(404);
    throw new Error("Dealer not found");
  }

  res.json({ message: "Dealer removed" });
});
