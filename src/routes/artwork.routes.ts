import { Router } from "express";
import {
  createArtwork,
  deleteArtwork,
  getArtwork,
  getArtworks,
  updateArtwork,
} from "../controllers/artwork.controller";
import { validateBody } from "../middlewares/validateRequest";
import { createArtworkSchema, updateArtworkSchema } from "../dtos/artwork.dto";

const router = Router();

router.get("/", getArtworks);
router.get("/:id", getArtwork);
router.post("/", validateBody(createArtworkSchema), createArtwork);
router.put("/:id", validateBody(updateArtworkSchema), updateArtwork);
router.delete("/:id", deleteArtwork);

export default router;
