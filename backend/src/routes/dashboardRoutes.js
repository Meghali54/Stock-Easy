import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.get("/summary", getDashboardSummary);

export default router;
