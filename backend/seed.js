/**
 * Seed script - creates the first Central Admin account if one does not
 * already exist, using credentials from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
 * in your .env file.
 *
 * Usage:  node seed.js
 */
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_SEED_EMAIL || "admin@pharmapulse.com").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";

  const existing = await User.findOne({ email, authProvider: "Credentials" });

  if (existing) {
    console.log(`ℹ️  Central admin already exists: ${email}`);
  } else {
    await User.create({
      shopId: null,
      name: "Central Admin",
      email,
      password,
      authProvider: "Credentials",
      role: "central_admin",
    });
    console.log(`✅ Central admin created: ${email} / ${password}`);
    console.log("⚠️  Please log in and change this password as soon as possible.");
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
