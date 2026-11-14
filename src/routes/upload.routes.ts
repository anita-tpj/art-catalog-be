import { CloudinaryImageStatus, CloudinaryImageType } from "@prisma/client";
import { Router, type Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  uploadArtistAvatar,
  uploadArtworkImage,
} from "../controllers/upload.controller";
import type { AdminRequest } from "../middlewares/requireAdmin";
import { requireRoles } from "../middlewares/requireAdmin";
import { uploadSingleImage } from "../middlewares/upload";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

const router = Router();

router.use(requireRoles(["ADMIN", "EDITOR"]));

async function deleteUploadedImage(
  req: AdminRequest,
  res: Response,
  resourceType: CloudinaryImageType,
) {
  const publicId = req.query.publicId;

  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError(
      ERROR_CODES.PUBLIC_ID_REQUIRED,
      400,
      "Image ID is required",
    );
  }

  const result = await prisma.cloudinaryImage.updateMany({
    where: {
      publicId,
      uploadedById: req.admin!.id,
      resourceType,
      status: CloudinaryImageStatus.TEMPORARY,
    },
    data: {
      status: CloudinaryImageStatus.PENDING_DELETE,
      nextRetryAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 403, "Image cannot be deleted");
  }

  return res.status(204).send();

  return res.status(204).send();
}

// /api/uploads/artist-avatar
router.post("/artist-avatar", uploadSingleImage, uploadArtistAvatar);

// /api/uploads/artwork-image
router.post("/artwork-image", uploadSingleImage, uploadArtworkImage);

router.delete("/artwork-image", (req, res) =>
  deleteUploadedImage(
    req as AdminRequest,
    res,
    CloudinaryImageType.ARTWORK_IMAGE,
  ),
);

router.delete("/artist-avatar", (req, res) =>
  deleteUploadedImage(
    req as AdminRequest,
    res,
    CloudinaryImageType.ARTIST_AVATAR,
  ),
);

export default router;
