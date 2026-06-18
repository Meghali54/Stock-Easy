/**
 * Catches 404s for unmatched routes.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handler. Any errors passed via next(err), or thrown
 * inside async route handlers wrapped with asyncHandler, end up here.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value entered for field: ${field}`;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

/**
 * Wraps async route handlers so thrown errors are forwarded to the
 * centralized error handler instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
