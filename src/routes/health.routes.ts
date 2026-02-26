import { Router } from "express";
import { checkCloudinary } from "../controllers/health.controller";

const router = Router();

// GET /api/health
router.get("/", (_req, res) => {
  res.status(200).json({ ok: true });
});

// GET /api/health/cloudinary
router.get("/cloudinary", checkCloudinary);

export default router;
