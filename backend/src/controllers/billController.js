import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import Batch from "../models/Batch.js";
import Medicine from "../models/Medicine.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

/**
 * Generates a sequential-looking bill number, e.g. INV-20260613-0001
 */
const generateBillNumber = async (shopId) => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");

  const countToday = await Bill.countDocuments({
    shopId,
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
    },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `INV-${datePart}-${seq}`;
};

/**
 * @desc    POS Checkout - processes a sale across one or more medicines.
 *          For each requested item, applies First-Expiry-First-Out (FEFO)
 *          batch consumption: queries batches for that medicine where
 *          quantityRemaining > 0 and expiryDate > now, sorted ascending
 *          by expiryDate, then sequentially decrements stock until the
 *          requested quantity is fulfilled. The entire operation runs
 *          inside a single MongoDB transaction session - if stock is
 *          insufficient for ANY item, the whole transaction is aborted
 *          and rolled back (all-or-nothing).
 *
 * @route   POST /api/bills/checkout
 * @access  Private (shop_owner, pharmacy_staff)
 *
 * Expected request body:
 * {
 *   customerName, customerPhone,
 *   items: [{ medicineId, quantity }],
 *   paymentMode: 'Cash' | 'Card' | 'UPI' | 'CGHS Split',
 *   cghsSplit?: { patientSharePercent, cghsCardNumber },
 *   discountAmount?: number
 * }
 */
export const checkout = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const userId = req.user._id;

  const { customerName, customerPhone, items, paymentMode, cghsSplit, discountAmount } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("At least one item is required to checkout");
  }

  const session = await mongoose.startSession();

  try {
    let billDoc;

    await session.withTransaction(async () => {
      const billItems = [];
      let subTotal = 0;
      let taxAmount = 0;

      for (const requestedItem of items) {
        const { medicineId, quantity } = requestedItem;

        if (!medicineId || !quantity || quantity <= 0) {
          throw new Error("Each item requires a valid medicineId and a positive quantity");
        }

        const medicine = await Medicine.findOne({ _id: medicineId, shopId }).session(session);
        if (!medicine) {
          throw new Error(`Medicine not found: ${medicineId}`);
        }

        // ---- FEFO BATCH SELECTION ----
        // Fetch eligible, non-expired batches with remaining stock,
        // ordered by soonest-expiry first.
        const eligibleBatches = await Batch.find({
          shopId,
          medicineId,
          quantityRemaining: { $gt: 0 },
          expiryDate: { $gt: new Date() },
        })
          .sort({ expiryDate: 1 })
          .session(session);

        let remainingToFulfill = quantity;

        for (const batch of eligibleBatches) {
          if (remainingToFulfill <= 0) break;

          const takeFromBatch = Math.min(batch.quantityRemaining, remainingToFulfill);

          // Atomically decrement this batch's stock
          batch.quantityRemaining -= takeFromBatch;
          await batch.save({ session });

          const lineTotal = takeFromBatch * batch.sellingPrice;
          const lineTax = (lineTotal * (medicine.gstRate || 0)) / 100;

          billItems.push({
            medicineId: medicine._id,
            medicineName: medicine.name,
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            quantitySold: takeFromBatch,
            unitPrice: batch.sellingPrice,
            gstRate: medicine.gstRate || 0,
            lineTotal,
          });

          subTotal += lineTotal;
          taxAmount += lineTax;
          remainingToFulfill -= takeFromBatch;
        }

        if (remainingToFulfill > 0) {
          // Not enough stock across any non-expired batch - abort the
          // ENTIRE transaction (all-or-nothing), rolling back any
          // decrements already applied for previous items.
          throw new Error(
            `Insufficient stock for "${medicine.name}". Short by ${remainingToFulfill} unit(s) under FEFO allocation.`
          );
        }
      }

      const discount = Number(discountAmount) || 0;
      const totalAmount = Math.max(0, subTotal + taxAmount - discount);

      // ---- CGHS SPLIT BILLING ----
      let cghsSplitData = {
        enabled: false,
        patientSharePercent: 20,
        cghsSharePercent: 80,
        patientShareAmount: 0,
        cghsShareAmount: 0,
        cghsCardNumber: "",
      };

      if (paymentMode === "CGHS Split") {
        const patientPercent = cghsSplit?.patientSharePercent ?? 20;
        const cghsPercent = 100 - patientPercent;

        cghsSplitData = {
          enabled: true,
          patientSharePercent: patientPercent,
          cghsSharePercent: cghsPercent,
          patientShareAmount: Math.round((totalAmount * patientPercent) / 100),
          cghsShareAmount: Math.round((totalAmount * cghsPercent) / 100),
          cghsCardNumber: cghsSplit?.cghsCardNumber || "",
        };
      }

      const billNumber = await generateBillNumber(shopId);

      const [createdBill] = await Bill.create(
        [
          {
            shopId,
            billNumber,
            customerName: customerName || "Walk-in Customer",
            customerPhone: customerPhone || "",
            items: billItems,
            subTotal: Math.round(subTotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discountAmount: discount,
            totalAmount: Math.round(totalAmount * 100) / 100,
            paymentMode: paymentMode || "Cash",
            cghsSplit: cghsSplitData,
            createdBy: userId,
          },
        ],
        { session }
      );

      billDoc = createdBill;
    });

    res.status(201).json(billDoc);
  } catch (error) {
    res.status(400);
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Get paginated bill history for the shop.
 * @route   GET /api/bills?page=1&limit=20
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getBills = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [bills, total] = await Promise.all([
    Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name"),
    Bill.countDocuments({ shopId }),
  ]);

  res.json({ bills, total, page, pages: Math.ceil(total / limit) });
});

/**
 * @desc    Get a single bill by ID (for printing / receipt view).
 * @route   GET /api/bills/:id
 * @access  Private (shop_owner, pharmacy_staff)
 */
export const getBillById = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;

  const bill = await Bill.findOne({ _id: req.params.id, shopId }).populate("createdBy", "name");

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  res.json(bill);
});
