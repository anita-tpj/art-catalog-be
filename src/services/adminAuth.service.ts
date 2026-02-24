// src/services/adminAuth.service.ts
import bcrypt from "bcrypt";
import { Prisma, AdminRole } from "@prisma/client";
import prisma from "../prisma";



const SESSION_TTL_DAYS = 7;

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export type AdminMeDto = {
  id: string;
  email: string;
  role: AdminRole;
};

export async function adminLogin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const session = await prisma.adminSession.create({
    data: {
      adminUserId: user.id,
      expiresAt: sessionExpiresAt(),
    },
  });

  return {
    sessionId: session.id,
    user: { id: user.id, email: user.email, role: user.role } satisfies AdminMeDto,
  };
}

export async function adminLogout(sessionId: string) {
  await prisma.adminSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function adminMeFromSession(sessionId: string | null): Promise<AdminMeDto | null> {
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
  };
}