import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * @desc    List all staff members (and the owner) for the shop.
 * @route   GET /api/staff
 * @access  Private (shop_owner)
 */
export const getStaff = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const staff = await User.find({ shopId }).select("-password").sort({ createdAt: 1 });
  res.json(staff);
});

/**
 * @desc    Add a new pharmacy staff member. Staff sign in via the same
 *          mock Google flow; the owner pre-registers their email here
 *          so that when they sign in with Google, they're auto-linked
 *          to this shop with the 'pharmacy_staff' role.
 * @route   POST /api/staff
 * @access  Private (shop_owner)
 */
export const addStaff = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { name, email } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const staffMember = await User.create({
    shopId,
    name,
    email: email.toLowerCase(),
    authProvider: "Google",
    role: "pharmacy_staff",
  });

  res.status(201).json(staffMember);
});

/**
 * @desc    Toggle a staff member's active status.
 * @route   PATCH /api/staff/:id/status
 * @access  Private (shop_owner)
 */
export const toggleStaffStatus = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const staffMember = await User.findOne({ _id: req.params.id, shopId, role: "pharmacy_staff" });

  if (!staffMember) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  staffMember.isActive = !staffMember.isActive;
  await staffMember.save();

  res.json({ message: "Status updated", isActive: staffMember.isActive });
});

/**
 * @desc    Remove a staff member.
 * @route   DELETE /api/staff/:id
 * @access  Private (shop_owner)
 */
export const deleteStaff = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const staffMember = await User.findOneAndDelete({
    _id: req.params.id,
    shopId,
    role: "pharmacy_staff",
  });

  if (!staffMember) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  res.json({ message: "Staff member removed" });
});
