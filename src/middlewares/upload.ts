import multer from "multer";

/**
 * Use memoryStorage for Cloudinary streaming uploads
 */
const storage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5MB per file
  },
});

export const uploadSingleImage = storage.single("file");
