
import { Router } from "express";
import {
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
} from "../controllers/adminUsers.controller";
import { requireRoles } from "../middlewares/requireAdmin";

const router = Router();

router.patch(
  "/:id/deactivate",
  requireRoles(["ADMIN"]),
  deactivateAdminUser,
);

router.patch(
  "/:id/activate",
  requireRoles(["ADMIN"]),
  activateAdminUser,
);

router.delete(
  "/:id",
  requireRoles(["ADMIN"]),
  deleteAdminUser,
);

export default router;
