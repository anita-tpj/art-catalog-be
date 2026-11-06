// src/services/adminAuth.service.ts
import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { ERROR_CODES } from "../constants/errorCodes";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

const SESSION_TTL_DAYS = 7;

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export type AdminMeDto = {
  id: string;
  email: string;
  role: AdminRole;
  artistId: number | null;
};

export async function adminLogin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      401,
      "Invalid credentials",
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      401,
      "Invalid credentials",
    );
  }

  const session = await prisma.adminSession.create({
    data: {
      adminUserId: user.id,
      expiresAt: sessionExpiresAt(),
    },
  });

  return {
    sessionId: session.id,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      artistId: user.artistId,
    } satisfies AdminMeDto,
  };
}

export async function adminLogout(sessionId: string) {
  await prisma.adminSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function adminMeFromSession(
  sessionId: string | null,
): Promise<AdminMeDto | null> {
  if (!sessionId) return null;

  const session = await prisma.adminSession.findFirst({
    where: {
      id: sessionId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      adminUser: true,
    },
  });

  if (!session?.adminUser) return null;
  if (!session.adminUser.isActive) return null;

  return {
    id: session.adminUser.id,
    email: session.adminUser.email,
    role: session.adminUser.role,
    artistId: session.adminUser.artistId,
  };
}
