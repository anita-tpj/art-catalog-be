// src/controllers/authAdmin.controller.ts
import type { Request, Response } from "express";
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
