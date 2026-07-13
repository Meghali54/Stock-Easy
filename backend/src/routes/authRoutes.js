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
export default router;