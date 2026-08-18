import express from "express";
import {
  getDashboardSummary,
  getDashboardExtended,
} from "../controllers/dashboardController.js";
import {
  protect,
  authorize,
  requireApprovedShop,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Option A: Apply middlewares sequentially
router.use(protect);
router.use(authorize("shop_owner", "pharmacy_staff", "central_admin"));
router.use(requireApprovedShop);

router.get("/summary", getDashboardSummary);
router.get("/extended", getDashboardExtended);

export default router;
