import express from "express";
import passport from "passport";
import { adminLogin, googleCallback, submitOnboarding, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadShopDocuments } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/admin/login", adminLogin);

// ── Real Google OAuth flow ──────────────────────────────────────────────
// Step 1: browser is sent here, which redirects to Google's consent screen.
router.get(
  "/google/redirect",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here after the user approves/denies.
// passport.authenticate runs the verify callback in config/passport.js,
// then googleCallback issues our own JWT and redirects to the frontend.
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_auth_failed" }),
  googleCallback
);

// Onboarding accepts multipart/form-data (text fields + 4 document
// files) via the uploadShopDocuments multer middleware.
router.post("/onboarding", protect, uploadShopDocuments, submitOnboarding);

router.get("/me", protect, getMe);

export default router;
