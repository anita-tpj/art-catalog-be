import { Router } from "express";
import {
  createArtist,
  deleteArtist,
  getAllArtists,
  getAllPublishedArtists,
  getArtist,
  getPaginatedArtists,
  getPaginatedPublishedArtists,
  getPublishedArtist,
  getPublishedArtistBySlug,
  updateArtist,
} from "../controllers/artist.controller";

import { createArtistSchema, updateArtistSchema } from "../dtos/artist.dto";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

// Public
// Public
router.get("/public/all", getAllPublishedArtists);
router.get("/public", getPaginatedPublishedArtists);
router.get("/public/profile/:slug", getPublishedArtistBySlug);
router.get("/public/:id", getPublishedArtist);

// Admin
router.get("/all", getAllArtists);
router.get("/", getPaginatedArtists);
router.get("/:id", getArtist);

router.post("/", validateBody(createArtistSchema), createArtist);
router.put("/:id", validateBody(updateArtistSchema), updateArtist);
router.delete("/:id", deleteArtist);

export default router;
