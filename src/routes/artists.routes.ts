import { Router } from "express";
import {
  getArtists,
  getArtist,
  createArtist,
  updateArtist,
  deleteArtist,
} from "../controllers/artist.controller";
import { createArtistSchema, updateArtistSchema } from "../dtos/artist.dto";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();
router.get("/test/error", (req, res, next) => {
  const err: any = new Error("Test error triggered manually");
  err.statusCode = 500;
  next(err);
});
router.get("/", getArtists);
router.get("/:id", getArtist);
router.post("/", validateBody(createArtistSchema), createArtist);
router.put("/:id", validateBody(updateArtistSchema), updateArtist);
router.delete("/:id", deleteArtist);

export default router;
