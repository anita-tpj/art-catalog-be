import { Router } from "express";
import {
  createArtwork,
  deleteArtwork,
  getAllArtworks,
  getAllPublishedArtworks,
  getArtwork,
  getPaginatedArtworks,
  getPaginatedPublishedArtworks,
  getPublishedArtwork,
  updateArtwork,
} from "../controllers/artwork.controller";
import { createArtworkSchema, updateArtworkSchema } from "../dtos/artwork.dto";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

// Public
router.get("/public/all", getAllPublishedArtworks);
router.get("/public", getPaginatedPublishedArtworks);
router.get("/public/:id", getPublishedArtwork);

// Admin
router.get("/all", getAllArtworks);
router.get("/", getPaginatedArtworks);
router.get("/:id", getArtwork);

router.post("/", validateBody(createArtworkSchema), createArtwork);
router.put("/:id", validateBody(updateArtworkSchema), updateArtwork);
router.delete("/:id", deleteArtwork);

export default router;
