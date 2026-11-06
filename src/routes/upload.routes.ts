import { Router, type Request, type Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  uploadArtistAvatar,
  uploadArtworkImage,
} from "../controllers/upload.controller";
import { deleteImage } from "../libs/cloudinary";
import { uploadSingleImage } from "../middlewares/upload";
import { AppError } from "../utils/AppError";

const router = Router();

async function deleteUploadedImage(req: Request, res: Response) {
  const publicId = req.query.publicId;

  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError(
      ERROR_CODES.PUBLIC_ID_REQUIRED,
      400,
      "Image ID is required",
    );
  }

  await deleteImage(publicId);

  return res.status(204).send();
}

// /api/uploads/artist-avatar
router.post("/artist-avatar", uploadSingleImage, uploadArtistAvatar);

// /api/uploads/artwork-image
router.post("/artwork-image", uploadSingleImage, uploadArtworkImage);

// /api/uploads/artwork-image
router.delete("/artwork-image", deleteUploadedImage);

// /api/uploads/artist-avatar
router.delete("/artist-avatar", deleteUploadedImage);

export default router;
