import { Router } from "express";
import {
  postAdminLogin,
  postAdminLogout,
  getAdminMe,
} from "../controllers/authAdmin.controller";

const router = Router();

router.post("/login", postAdminLogin);
router.post("/logout", postAdminLogout);
router.get("/me", getAdminMe);

export default router;