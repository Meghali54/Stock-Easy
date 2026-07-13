import express from "express";
import passport from "passport";
import { adminLogin, googleCallback, submitOnboarding, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadShopDocuments } from "../middleware/uploadMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/admin/login", adminLogin);

// ── Real Google OAuth flow ──────────────────────────────────────────────
router.get(
  "/google/redirect",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_auth_failed" }),
  googleCallback
);

router.post("/onboarding", protect, uploadShopDocuments, submitOnboarding);

router.get("/me", protect, getMe);

// ── TEMPORARY SEED ROUTE ─────────────────────────────────────────────
// DELETE THIS after running it once in production.
// Visit GET /api/auth/seed-admin in browser to create the admin account.
router.get("/seed-admin", async (req, res) => {
  try {
    const existing = await User.findOne({
      email: process.env.ADMIN_SEED_EMAIL?.toLowerCase(),
      authProvider: "Credentials",
    });

    if (existing) {
      return res.json({ message: "Admin already exists", email: existing.email });
    }

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.default.genSalt(10);
    const hashed = await bcrypt.default.hash(
      process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!",
      salt
    );

    const admin = await User.create({
      shopId: null,
      name: "Central Admin",
      email: process.env.ADMIN_SEED_EMAIL?.toLowerCase() || "admin@pharmapulse.com",
      password: hashed,
      authProvider: "Credentials",
      role: "central_admin",
    });

    res.json({ message: "Admin created successfully", email: admin.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ── END TEMPORARY SEED ROUTE ─────────────────────────────────────────

export default router;