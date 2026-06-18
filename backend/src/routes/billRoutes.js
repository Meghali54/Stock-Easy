import express from "express";
import { checkout, getBills, getBillById } from "../controllers/billController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.post("/checkout", checkout);
router.get("/", getBills);
router.get("/:id", getBillById);

export default router;
