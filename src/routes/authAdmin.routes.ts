
import { Router } from "express";
import {
  postAdminLogin,
  postAdminLogout,
  getAdminMe,
  postAdminForgotPassword,
  postAdminResetPassword,
} from "../controllers/authAdmin.controller";
import {
    forgotPasswordEmailLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../middlewares/passwordResetRateLimit";

const router = Router();

router.post("/login", postAdminLogin);
router.post("/logout", postAdminLogout);
router.get("/me", getAdminMe);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordEmailLimiter,
  postAdminForgotPassword,
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  postAdminResetPassword,
);

export default router;
