import express from "express";
import {
  getGlobalMetrics,
  getVerificationQueue,
  getAllShops,
  approveShop,
  rejectShop,
  updateShopSubscription,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require a logged-in central_admin
router.use(protect, authorize("central_admin"));

router.get("/metrics", getGlobalMetrics);
router.get("/verification-queue", getVerificationQueue);
router.get("/shops", getAllShops);
router.patch("/shops/:id/approve", approveShop);
router.patch("/shops/:id/reject", rejectShop);
router.patch("/shops/:id/subscription", updateShopSubscription);

export default router;
