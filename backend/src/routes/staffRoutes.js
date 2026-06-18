import express from "express";
import { getStaff, addStaff, toggleStaffStatus, deleteStaff } from "../controllers/staffController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner"), requireApprovedShop);

router.get("/", getStaff);
router.post("/", addStaff);
router.patch("/:id/status", toggleStaffStatus);
router.delete("/:id", deleteStaff);

export default router;
