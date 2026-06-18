import express from "express";
import {
  getBatches,
  getBatchSummary,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../controllers/batchController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.get("/", getBatches);
router.get("/summary", getBatchSummary);
router.post("/", createBatch);
router.put("/:id", updateBatch);
router.delete("/:id", deleteBatch);

export default router;
