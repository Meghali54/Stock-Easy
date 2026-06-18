import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null, // null for central_admin users
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Only populated for 'Credentials' auth provider (Central Admin)
    password: {
      type: String,
      select: false,
    },

    // 'Credentials' -> Central Admin email/password login
    // 'Google'      -> Shop Owner / Staff Google sign-in (mock or live)
    authProvider: {
      type: String,
      enum: ["Credentials", "Google"],
      required: true,
    },

    googleId: {
      type: String,
      default: null,
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["central_admin", "shop_owner", "pharmacy_staff"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only for Credentials provider)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
