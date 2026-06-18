import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT containing the user's id, role and shopId.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      shopId: user.shopId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;
