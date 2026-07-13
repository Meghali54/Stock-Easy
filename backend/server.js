// MUST be the very first import - loads process.env from .env before
import "./src/config/env.js";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import session from "express-session";

import connectDB from "./src/config/db.js";
import passport from "./src/config/passport.js";
import { notFound, errorHandler } from "./src/middleware/errorMiddleware.js";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import medicineRoutes from "./src/routes/medicineRoutes.js";
import batchRoutes from "./src/routes/batchRoutes.js";
import billRoutes from "./src/routes/billRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import dealerRoutes from "./src/routes/dealerRoutes.js";
import staffRoutes from "./src/routes/staffRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import { startKeepAlive } from "./src/utils/keepAlive.js";

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ---- CORS ----
// Log the allowed origin on startup so we can verify it in Render logs
console.log("✅ CLIENT_ORIGIN:", process.env.CLIENT_ORIGIN);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      const clientOrigin = process.env.CLIENT_ORIGIN || "";

      // Allow exact match, localhost, or any vercel.app subdomain
      if (
        !origin ||
        origin === clientOrigin ||
        origin === "http://localhost:3000" ||
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.error(`❌ CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "pharma-pulse-oauth-handshake-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 },
  })
);
app.use(passport.initialize());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- Static file serving for uploaded verification documents ----
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---- Health Check & Keep-Alive Ping ----
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Pharma Pulse (Stock Easy) API",
    time: new Date().toISOString(),
    uptime: process.uptime(),
    clientOrigin: process.env.CLIENT_ORIGIN,
  });
});

app.get("/api/ping", (_req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

// ---- API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

// ---- Error Handling ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Pharma Pulse (Stock Easy) API running on port ${PORT}`);
  startKeepAlive();
});