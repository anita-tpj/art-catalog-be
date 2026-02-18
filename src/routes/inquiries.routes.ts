import { Router } from "express";
import {
  createInquiry,
  getInquiry,
  updateInquiry,
  getPaginatedInquiries,
  getInquiriesStats
} from "../controllers/inquiries.controller";

const router = Router();

router.post("/", createInquiry);
router.get("/", getPaginatedInquiries);
router.get("/stats", getInquiriesStats);
router.get("/:id", getInquiry);
router.put("/:id", updateInquiry);

export default router;
