import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller";

const router = Router();

router.get("/", getAdminDashboard);

export default router;
