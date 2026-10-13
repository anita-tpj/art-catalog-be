import { Router } from "express";
import {
  createInquiry,
  deleteInquiry,
  getInquiriesStats,
  getInquiry,
  getPaginatedInquiries,
  updateInquiry,
} from "../controllers/inquiries.controller";
import { requireRoles } from "../middlewares/requireAdmin";

const router = Router();

router.post("/", createInquiry);

router.get(
  "/",
  requireRoles(["ADMIN", "EDITOR", "VIEWER"]),
  getPaginatedInquiries,
);

router.get(
  "/stats",
  requireRoles(["ADMIN", "EDITOR", "VIEWER"]),
  getInquiriesStats,
);

router.get("/:id", requireRoles(["ADMIN", "EDITOR", "VIEWER"]), getInquiry);

router.put("/:id", requireRoles(["ADMIN", "EDITOR"]), updateInquiry);

router.delete("/:id", requireRoles(["ADMIN"]), deleteInquiry);

export default router;
