import { Router } from "express";
import {
  getAdminInvitation,
  postAcceptAdminInvitation,
} from "../controllers/adminInvitation.controller";

const router = Router();

router.get("/:token", getAdminInvitation);
router.post("/accept", postAcceptAdminInvitation);

export default router;