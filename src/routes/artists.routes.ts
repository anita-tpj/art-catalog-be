import { Router } from "express";
import {
  getPaginatedArtists,
  getArtist,
  createArtist,
  updateArtist,
  deleteArtist,
  getAllArtists,
} from "../controllers/artist.controller";
import { createArtistSchema, updateArtistSchema } from "../dtos/artist.dto";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

router.get("/all", getAllArtists);
router.get("/", getPaginatedArtists);
router.get("/:id", getArtist);
router.post("/", validateBody(createArtistSchema), createArtist);
router.put("/:id", validateBody(updateArtistSchema), updateArtist);
router.delete("/:id", deleteArtist);

export default router;
