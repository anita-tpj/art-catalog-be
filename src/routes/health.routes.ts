import { Router } from "express";
import { checkCloudinary } from "../controllers/health.controller";

const router = Router();

// GET /api/health/cloudinary
router.get("/cloudinary", checkCloudinary);

export default router;
