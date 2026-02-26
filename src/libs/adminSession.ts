// src/libs/adminSession.ts
import type { Request, Response } from "express";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_DAYS = 7;

export function getAdminSessionId(req: Request): string | null {
  const v = (req as any).cookies?.[ADMIN_SESSION_COOKIE];
  if (!v || typeof v !== "string") return null;
  return v;
}

export function setAdminSessionCookie(res: Response, sessionId: string) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAgeMs = ADMIN_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

  res.cookie(ADMIN_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd, // prod: true (HTTPS), dev: false
    sameSite: isProd ? "none" : "lax", // IMPORTANT: cross-site cookie in prod
    maxAge: maxAgeMs,
    path: "/",
  });
}

export function clearAdminSessionCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}
