
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../prisma";
import { sendPasswordResetEmail } from "./passwordResetEmail.service";

const RESET_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function resetExpiresAt(): Date {
  return new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
}

export async function requestAdminPasswordReset(
  email: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });

  // Do not reveal whether an account exists or is active.
  if (!user || !user.isActive) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.$transaction(async (tx) => {
    await tx.adminPasswordResetToken.deleteMany({
      where: { adminUserId: user.id },
    });

    await tx.adminPasswordResetToken.create({
      data: {
        adminUserId: user.id,
        tokenHash,
        expiresAt: resetExpiresAt(),
      },
    });
  });

  try {
    await sendPasswordResetEmail({
      email: user.email,
      token,
    });
  } catch (error) {
    // Remove this token if Resend rejects the request.
    await prisma.adminPasswordResetToken.deleteMany({
      where: { tokenHash },
    });

    throw error;
  }
}

export async function resetAdminPassword(
  token: string,
  password: string,
): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const tokenHash = hashToken(token);
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const now = new Date();

    const resetToken = await tx.adminPasswordResetToken.findUnique({
      where: { tokenHash },
      select: {
        adminUserId: true,
        expiresAt: true,
        adminUser: {
          select: { isActive: true },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.expiresAt <= now ||
      !resetToken.adminUser.isActive
    ) {
      throw new Error("INVALID_RESET_TOKEN");
    }

    // Only one concurrent request can claim this token.
    const claimed = await tx.adminPasswordResetToken.deleteMany({
      where: {
        tokenHash,
        expiresAt: { gt: now },
      },
    });

    if (claimed.count !== 1) {
      throw new Error("INVALID_RESET_TOKEN");
    }

    await tx.adminUser.update({
      where: { id: resetToken.adminUserId },
      data: { passwordHash },
    });

    // Revoke every existing CMS session.
    await tx.adminSession.updateMany({
      where: {
        adminUserId: resetToken.adminUserId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    // Invalidate any other reset tokens.
    await tx.adminPasswordResetToken.deleteMany({
      where: { adminUserId: resetToken.adminUserId },
    });
  });
}
