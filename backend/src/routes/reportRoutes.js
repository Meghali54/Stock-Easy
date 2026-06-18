import express from "express";
import { getSalesReport } from "../controllers/reportController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.get("/sales", getSalesReport);

export default router;
