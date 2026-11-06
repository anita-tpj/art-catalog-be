import type { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  forgotAdminPasswordSchema,
  resetAdminPasswordSchema,
} from "../dtos/adminPasswordReset.dto";
import {
  clearAdminSessionCookie,
  getAdminSessionId,
  setAdminSessionCookie,
} from "../libs/adminSession";
import {
  adminLogin,
  adminLogout,
  adminMeFromSession,
} from "../services/adminAuth.service";
import {
  requestAdminPasswordReset,
  resetAdminPassword,
} from "../services/adminPasswordReset.service";
import { AppError } from "../utils/AppError";

export async function postAdminLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, "Invalid payload");
  }

  const { sessionId, user } = await adminLogin(
    email.trim().toLowerCase(),
    password,
  );

  setAdminSessionCookie(res, sessionId);

  return res.status(200).json({ user });
}

export async function postAdminLogout(req: Request, res: Response) {
  try {
    const sessionId = getAdminSessionId(req);

    if (sessionId) {
      await adminLogout(sessionId);
    }
  } catch (error) {
    // Preserve existing behavior: clear the browser cookie
    // even if server-side session revocation fails.
    console.error("postAdminLogout error:", error);
  }

  clearAdminSessionCookie(res);

  return res.status(204).send();
}

export async function getAdminMe(req: Request, res: Response) {
  const sessionId = getAdminSessionId(req);
  const user = await adminMeFromSession(sessionId);

  if (!user) {
    clearAdminSessionCookie(res);

    throw new AppError(ERROR_CODES.UNAUTHORIZED, 401, "Unauthenticated");
  }

  return res.status(200).json({ user });
}

export async function postAdminForgotPassword(req: Request, res: Response) {
  const { email } = forgotAdminPasswordSchema.parse(req.body);

  try {
    await requestAdminPasswordReset(email);
  } catch (error) {
    // Do not expose whether an account exists or whether
    // sending the password reset email failed.
    console.error("postAdminForgotPassword error:", error);
  }

  return res.status(200).json({
    message: "If an account exists, a password reset link will be sent.",
  });
}

export async function postAdminResetPassword(req: Request, res: Response) {
  const { token, password } = resetAdminPasswordSchema.parse(req.body);

  await resetAdminPassword(token, password);

  clearAdminSessionCookie(res);

  return res.status(200).json({
    message: "Password updated successfully",
  });
}
