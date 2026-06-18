import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "shop-documents");

// Ensure the upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Prefix with timestamp + random suffix to avoid collisions, keep
    // the field name (e.g. "drugLicenseDoc") so files stay identifiable.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPG, PNG, WEBP and PDF are allowed.`));
  }
};

const maxSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 5;

export const uploadShopDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
}).fields([
  { name: "drugLicenseDoc", maxCount: 1 },
  { name: "panCardDoc", maxCount: 1 },
  { name: "gstCertificateDoc", maxCount: 1 },
  { name: "shopPhotoDoc", maxCount: 1 },
]);

export const UPLOAD_URL_PREFIX = "/uploads/shop-documents";
