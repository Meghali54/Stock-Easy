import mongoose from "mongoose";

/**
 * Initializes the connection to MongoDB Atlas using the URI provided
 * via the MONGO_URI environment variable.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error(
        "MONGO_URI is not defined. Please set it in your .env file."
      );
    }

    const conn = await mongoose.connect(uri, {
      // Modern mongoose (8.x) no longer needs useNewUrlParser / useUnifiedTopology
      // but they are harmless if included for older drivers.
    });

    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
