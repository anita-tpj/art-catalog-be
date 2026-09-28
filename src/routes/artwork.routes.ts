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
import { requireRoles } from "../middlewares/requireAdmin";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

// Public
router.get("/public/all", getAllPublishedArtworks);
router.get("/public", getPaginatedPublishedArtworks);
router.get("/public/:id", getPublishedArtwork);

// Admin / CMS
router.get("/all", requireRoles(["ADMIN", "EDITOR", "VIEWER"]), getAllArtworks);

router.get(
  "/",
  requireRoles(["ADMIN", "EDITOR", "VIEWER"]),
  getPaginatedArtworks,
);

router.get("/:id", requireRoles(["ADMIN", "EDITOR", "VIEWER"]), getArtwork);

router.post(
  "/",
  requireRoles(["ADMIN", "EDITOR"]),
  validateBody(createArtworkSchema),
  createArtwork,
);

router.put(
  "/:id",
  requireRoles(["ADMIN", "EDITOR"]),
  validateBody(updateArtworkSchema),
  updateArtwork,
);

router.delete("/:id", requireRoles(["ADMIN"]), deleteArtwork);

export default router;
