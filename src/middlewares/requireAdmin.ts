import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { getAdminSessionId } from "../libs/adminSession";
import { adminMeFromSession } from "../services/adminAuth.service";

// Extend req with admin (TypeScript-friendly)
export type AdminRequest = Request & {
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
  };
};

export function requireRoles(allowed: AdminRole[]) {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = getAdminSessionId(req);
      const admin = await adminMeFromSession(sessionId);

      if (!admin) {
        return res.status(401).json({ message: "Unauthenticated" });
      }

      if (!allowed.includes(admin.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.admin = admin;
      return next();
    } catch (e) {
      console.error("requireRoles error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
