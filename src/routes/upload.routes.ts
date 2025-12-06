import { Router } from "express";
import {
  uploadArtistAvatar,
  uploadArtworkImage,
} from "../controllers/upload.controller";
import { uploadSingleImage } from "../middlewares/upload";
import { deleteImage } from "../libs/cloudinary";

const router = Router();

// /api/uploads/artist-avatar
router.post("/artist-avatar", uploadSingleImage, uploadArtistAvatar);

// /api/uploads/artwork-image
router.post("/artwork-image", uploadSingleImage, uploadArtworkImage);

router.delete("/artwork-image", async (req, res) => {
  const publicImgId = req.query.publicId as string | undefined;

  if (!publicImgId) {
    return res.status(400).json({ message: "publicId is required" });
  }

  try {
    await deleteImage(publicImgId);
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting Cloudinary image:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete Cloudinary image" });
  }
});

router.delete("/artist-avatar", async (req, res) => {
  const publicImgId = req.query.publicId as string | undefined;

  if (!publicImgId) {
    return res.status(400).json({ message: "publicId is required" });
  }

  try {
    await deleteImage(publicImgId);
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting artist avatar from Cloudinary:", err);
    return res.status(500).json({ message: "Failed to delete artist avatar" });
  }
});

export default router;
