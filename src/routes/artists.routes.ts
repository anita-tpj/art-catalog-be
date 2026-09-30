import { Router } from "express";
import {
  deleteArtistInvitation,
  getArtistCmsAccessStatus,
  postArtistInvitation,
} from "../controllers/adminInvitation.controller";
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
import { requireRoles } from "../middlewares/requireAdmin";
import { validateBody } from "../middlewares/validateRequest";

const router = Router();

// Public
router.get("/public/all", getAllPublishedArtists);
router.get("/public", getPaginatedPublishedArtists);
router.get("/public/profile/:slug", getPublishedArtistBySlug);
router.get("/public/:id", getPublishedArtist);

// Admin / CMS
router.get("/all", requireRoles(["ADMIN", "EDITOR", "VIEWER"]), getAllArtists);

router.get(
  "/",
  requireRoles(["ADMIN", "EDITOR", "VIEWER"]),
  getPaginatedArtists,
);

router.get(
  "/:id/cms-access",
  requireRoles(["ADMIN"]),
  getArtistCmsAccessStatus,
);

router.post(
  "/:id/cms-invitations",
  requireRoles(["ADMIN"]),
  postArtistInvitation,
);

router.delete(
  "/:id/cms-invitations/:invitationId",
  requireRoles(["ADMIN"]),
  deleteArtistInvitation,
);

router.get("/:id", requireRoles(["ADMIN", "EDITOR", "VIEWER"]), getArtist);

router.post(
  "/",
  requireRoles(["ADMIN"]),
  validateBody(createArtistSchema),
  createArtist,
);

router.put(
  "/:id",
  requireRoles(["ADMIN", "EDITOR"]),
  validateBody(updateArtistSchema),
  updateArtist,
);

router.delete("/:id", requireRoles(["ADMIN"]), deleteArtist);

export default router;
