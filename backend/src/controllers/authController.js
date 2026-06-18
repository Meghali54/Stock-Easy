import User from "../models/User.js";
import Shop from "../models/Shop.js";
import generateToken from "../utils/generateToken.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { UPLOAD_URL_PREFIX } from "../middleware/uploadMiddleware.js";

/**
 * @desc    Central Admin login via classic Email/Password
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase(), authProvider: "Credentials" }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.role !== "central_admin") {
    res.status(403);
    throw new Error("This login is reserved for Central Admin accounts");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    token: generateToken(user),
  });
});

/**
 * @desc    Google OAuth callback. Passport has already verified the
 *          Google profile and attached the upserted User document to
 *          req.user (see config/passport.js). We issue our own JWT
 *          here and redirect the browser back to the frontend with it
 *          as a URL fragment, since this leg of the flow is a full
 *          page redirect (not an XHR call the frontend can read JSON
 *          from directly).
 * @route   GET /api/auth/google/callback
 * @access  Public (reached only via Google's redirect)
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    const failureUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:3000"}/auth?error=google_auth_failed`;
    return res.redirect(failureUrl);
  }

  const token = generateToken(user);
  const needsOnboarding = user.role === "shop_owner" && !user.shopId;

  // Redirect back to the frontend with the token in the URL fragment
  // (#...) rather than a query string, so it never gets logged by
  // servers/proxies or sent in a Referer header. The frontend's
  // AuthCallbackPage reads window.location.hash to extract it.
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
  const redirectUrl = `${clientOrigin}/auth/callback#token=${token}&needsOnboarding=${needsOnboarding}`;

  res.redirect(redirectUrl);
});

/**
 * @desc    Submit the 4-Step Shop Registration Wizard. Creates a new
 *          Shop document with verificationStatus 'Pending' and links
 *          it to the authenticated shop_owner user. Accepts real
 *          file uploads (multipart/form-data) for the four
 *          verification documents via multer - see uploadMiddleware.js.
 * @route   POST /api/auth/onboarding
 * @access  Private (shop_owner only, must not already have a shop)
 */
export const submitOnboarding = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "shop_owner") {
    res.status(403);
    throw new Error("Only shop owners can register a new shop");
  }

  if (user.shopId) {
    res.status(400);
    throw new Error("This account is already linked to a shop");
  }

  // Text fields arrive as regular multipart form fields (req.body),
  // exactly like JSON fields would, since multer parses them alongside
  // the file parts.
  const {
    ownerName,
    phone,
    shopName,
    drugLicenseNumber,
    panNumber,
    gstin,
    addressLine1,
    city,
    state,
    pincode,
  } = req.body;

  if (!shopName || !drugLicenseNumber || !panNumber || !gstin) {
    res.status(400);
    throw new Error("Shop name, drug license, PAN and GSTIN are required");
  }

  // req.files is populated by multer's .fields() config in
  // uploadMiddleware.js - each key holds an array (maxCount: 1, so we
  // only ever read index 0).
  const files = req.files || {};

  const buildDocEntry = (fieldName) => {
    const file = files[fieldName]?.[0];
    if (!file) {
      return { fileName: "", url: "", mimeType: "", uploaded: false };
    }
    return {
      fileName: file.originalname,
      url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
      mimeType: file.mimetype,
      uploaded: true,
    };
  };

  const documents = {
    drugLicenseDoc: buildDocEntry("drugLicenseDoc"),
    panCardDoc: buildDocEntry("panCardDoc"),
    gstCertificateDoc: buildDocEntry("gstCertificateDoc"),
    shopPhotoDoc: buildDocEntry("shopPhotoDoc"),
  };

  const shop = await Shop.create({
    name: shopName,
    ownerName: ownerName || user.name,
    email: user.email,
    phone: phone || "",
    address: { line1: addressLine1 || "", city: city || "", state: state || "", pincode: pincode || "" },
    drugLicenseNumber,
    panNumber,
    gstin,
    documents,
    verificationStatus: "Pending",
    subscriptionTier: "Trial",
  });

  user.shopId = shop._id;
  await user.save();

  res.status(201).json({
    message: "Shop registration submitted for verification",
    shop,
    token: generateToken(user),
  });
});

/**
 * @desc    Get the currently authenticated user's profile, including
 *          their shop's verification status (if applicable).
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let shop = null;

  if (user.shopId) {
    shop = await Shop.findById(user.shopId);
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    shop,
  });
});
