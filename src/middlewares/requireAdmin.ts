import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import { getAdminSessionId } from "../libs/adminSession";
import { adminMeFromSession } from "../services/adminAuth.service";
import { AppError } from "../utils/AppError";

// Extend req with admin (TypeScript-friendly)
export type AdminRequest = Request & {
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
    artistId: number | null;
  };
};

export function requireRoles(allowed: AdminRole[]) {
  return async (req: AdminRequest, _res: Response, next: NextFunction) => {
    try {
      const sessionId = getAdminSessionId(req);
      const admin = await adminMeFromSession(sessionId);

      if (!admin) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, 401, "Unauthenticated");
      }

      if (!allowed.includes(admin.role)) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 403, "Forbidden");
      }

      req.admin = admin;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
