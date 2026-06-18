import express from "express";
import {
  getMedicines,
  searchMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { protect, authorize, requireApprovedShop } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shop_owner", "pharmacy_staff"), requireApprovedShop);

router.get("/", getMedicines);
router.get("/search", searchMedicines);
router.post("/", createMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
