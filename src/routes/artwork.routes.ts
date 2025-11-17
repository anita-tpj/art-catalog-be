import { Router } from "express";
import {
  createArtWork,
  deleteArtWork,
  getArtWork,
  getArtWorks,
  updateArtWork,
} from "../controllers/artwork.controller";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

router.get("/", getArtWorks);
router.get("/:id", getArtWork);
router.post("/", validateBody, createArtWork);
router.put("/:id", validateBody, updateArtWork);
router.delete("/:id", deleteArtWork);

export default router;
