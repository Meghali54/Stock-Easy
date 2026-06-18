import express from "express";
import { getDealers, createDealer, updateDealer, deleteDealer } from "../controllers/dealerController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.get("/", getDealers);
router.post("/", createDealer);
router.put("/:id", updateDealer);
router.delete("/:id", deleteDealer);

export default router;
