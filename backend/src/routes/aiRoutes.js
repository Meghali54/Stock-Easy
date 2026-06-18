import express from "express";
import { askAssistant, getAssistantHistory } from "../controllers/aiController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.post("/ask", askAssistant);
router.get("/history", getAssistantHistory);

export default router;
