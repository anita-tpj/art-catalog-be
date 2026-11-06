import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ERROR_CODES } from "../constants/errorCodes";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";
import { sendArtistInvitationEmail } from "./artistInvitationEmail.service";
import { sendWelcomeEmail } from "./welcomeEmail.service";

const INVITATION_TTL_HOURS = 48;
const TERMS_VERSION = "1.0";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function invitationExpiresAt() {
  return new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);
}

export async function createArtistInvitation(artistId: number, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!artist) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404, "Artist not found");
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
      409,
      "An account with this email already exists",
    );
  }

  const existingInvitation = await prisma.adminInvitation.findFirst({
    where: {
      email: normalizedEmail,
      acceptedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new AppError(
      ERROR_CODES.INVITATION_ALREADY_EXISTS,
      409,
      "An active invitation already exists for this email",
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const invitation = await prisma.adminInvitation.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      role: AdminRole.EDITOR,
      artistId,
      expiresAt: invitationExpiresAt(),
    },
    select: {
      id: true,
      email: true,
      role: true,
      artistId: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
    },
  });

  try {
    await sendArtistInvitationEmail({
      email: normalizedEmail,
      artistName: artist.name,
      token,
    });
  } catch (error) {
    await prisma.adminInvitation.delete({
      where: { id: invitation.id },
    });

    throw error;
  }

  return {
    invitation,
  };
}

export async function getInvitationByToken(token: string) {
  const tokenHash = hashToken(token);

  const invitation = await prisma.adminInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      role: true,
      artistId: true,
      expiresAt: true,
      acceptedAt: true,
      artist: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new AppError(
      ERROR_CODES.INVALID_INVITATION,
      404,
      "Invitation not found",
    );
  }

  if (invitation.acceptedAt) {
    throw new AppError(
      ERROR_CODES.INVITATION_ALREADY_ACCEPTED,
      410,
      "Invitation has already been accepted",
    );
  }

  if (invitation.expiresAt <= new Date()) {
    throw new AppError(
      ERROR_CODES.INVITATION_EXPIRED,
      410,
      "Invitation has expired",
    );
  }

  return invitation;
}

export async function acceptArtistInvitation(
  token: string,
  password: string,
  termsAccepted: boolean,
) {
  if (termsAccepted !== true) {
    throw new AppError(
      ERROR_CODES.TERMS_NOT_ACCEPTED,
      400,
      "You must accept the Terms of Use",
    );
  }

  const invitation = await getInvitationByToken(token);

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new AppError(
      ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
      409,
      "An account with this email already exists",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const now = new Date();

    const createdUser = await tx.adminUser.create({
      data: {
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        artistId: invitation.artistId,
        isActive: true,
        termsAcceptedAt: now,
        termsAcceptedVersion: TERMS_VERSION,
      },
      select: {
        id: true,
        email: true,
        role: true,
        artistId: true,
        isActive: true,
      },
    });

    await tx.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: now,
      },
    });

    return createdUser;
  });

  try {
    await sendWelcomeEmail({
      email: invitation.email,
      artistName: invitation.artist.name,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  return user;
}

export async function getArtistCmsAccess(artistId: number) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true },
  });

  if (!artist) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404, "Artist not found");
  }

  const accounts = await prisma.adminUser.findMany({
    where: { artistId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (accounts.length > 0) {
    return {
      status: "ACTIVE" as const,
      accounts,
      invitation: null,
    };
  }

  const invitation = await prisma.adminInvitation.findFirst({
    where: {
      artistId,
      acceptedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (invitation) {
    return {
      status: "PENDING" as const,
      accounts: [],
      invitation,
    };
  }

  return {
    status: "NONE" as const,
    accounts: [],
    invitation: null,
  };
}

export async function revokeArtistInvitation(
  artistId: number,
  invitationId: string,
) {
  const invitation = await prisma.adminInvitation.findFirst({
    where: {
      id: invitationId,
      artistId,
    },
    select: {
      id: true,
      acceptedAt: true,
    },
  });

  if (!invitation) {
    throw new AppError(
      ERROR_CODES.INVITATION_NOT_FOUND,
      404,
      "Invitation not found",
    );
  }

  if (invitation.acceptedAt) {
    throw new AppError(
      ERROR_CODES.INVITATION_ALREADY_ACCEPTED,
      409,
      "Accepted invitations cannot be revoked",
    );
  }

  await prisma.adminInvitation.delete({
    where: {
      id: invitation.id,
    },
  });
}
