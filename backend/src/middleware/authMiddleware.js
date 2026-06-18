import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Verifies the JWT from the Authorization header and attaches the
 * authenticated user document (minus password) to req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

/**
 * Restricts access to users whose role is included in the allowed list.
 * Usage: authorize('central_admin') or authorize('shop_owner', 'pharmacy_staff')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};

/**
 * Ensures the authenticated user's shop has been approved before
 * allowing access to operational (non-onboarding) endpoints.
 * Central admins bypass this check entirely (shopId is null for them).
 */
export const requireApprovedShop = async (req, res, next) => {
  try {
    if (req.user.role === "central_admin") return next();

    if (!req.user.shopId) {
      return res.status(403).json({ message: "No shop is associated with this account" });
    }

    // Populate shop status via a lightweight import to avoid circular deps
    const Shop = (await import("../models/Shop.js")).default;
    const shop = await Shop.findById(req.user.shopId);

    if (!shop) {
      return res.status(404).json({ message: "Associated shop not found" });
    }

    if (shop.verificationStatus !== "Approved") {
      return res.status(403).json({
        message: "Shop verification is still pending. Access restricted.",
        verificationStatus: shop.verificationStatus,
      });
    }

    req.shop = shop;
    next();
  } catch (error) {
    next(error);
  }
};
