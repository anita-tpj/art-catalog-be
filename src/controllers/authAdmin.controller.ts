// src/controllers/authAdmin.controller.ts
import type { Request, Response } from "express";
import { forgotAdminPasswordSchema, resetAdminPasswordSchema } from "../dtos/adminPasswordReset.dto";
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

export async function postAdminLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const { sessionId, user } = await adminLogin(
      email.trim().toLowerCase(),
      password,
    );

    setAdminSessionCookie(res, sessionId);

    return res.status(200).json({ user });
  } catch (e: any) {
    if (e?.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.error("postAdminLogin error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function postAdminLogout(req: Request, res: Response) {
  try {
    const sessionId = getAdminSessionId(req);

    if (sessionId) {
      await adminLogout(sessionId);
    }

    clearAdminSessionCookie(res);
    return res.status(204).send();
  } catch (e) {
    console.error("postAdminLogout error:", e);
    clearAdminSessionCookie(res);
    return res.status(204).send();
  }
}

export async function getAdminMe(req: Request, res: Response) {
  try {
    const sessionId = getAdminSessionId(req);
    const user = await adminMeFromSession(sessionId);

    if (!user) {
      clearAdminSessionCookie(res);
      return res.status(401).json({ message: "Unauthenticated" });
    }

    return res.status(200).json({ user });
  } catch (e) {
    console.error("getAdminMe error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function postAdminForgotPassword(req: Request, res: Response) {
  const parsed = forgotAdminPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    await requestAdminPasswordReset(parsed.data.email);

    return res.status(200).json({
      message: "If an account exists, a password reset link will be sent.",
    });
  } catch (error) {
    console.error("postAdminForgotPassword error:", error);

    // Do not expose email provider or account details.
    return res.status(200).json({
      message: "If an account exists, a password reset link will be sent.",
    });
  }
}

export async function postAdminResetPassword(req: Request, res: Response) {
  const parsed = resetAdminPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    await resetAdminPassword(parsed.data.token, parsed.data.password);

    clearAdminSessionCookie(res);

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return res.status(400).json({
        message: "Invalid or expired reset link",
      });
    }

    console.error("postAdminResetPassword error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
