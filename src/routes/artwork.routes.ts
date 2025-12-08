import { Router } from "express";
import {
  createArtwork,
  deleteArtwork,
  getAllArtworks,
  getArtwork,
  getPaginatedArtworks,
  updateArtwork,
} from "../controllers/artwork.controller";
import { validateBody } from "../middlewares/validateRequest";
import { createArtworkSchema, updateArtworkSchema } from "../dtos/artwork.dto";

const router = Router();

router.get("/all", getAllArtworks);
router.get("/", getPaginatedArtworks);
router.get("/:id", getArtwork);
router.post("/", validateBody(createArtworkSchema), createArtwork);
router.put("/:id", validateBody(updateArtworkSchema), updateArtwork);
router.delete("/:id", deleteArtwork);

export default router;
