import { AdminRole } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../prisma";

const INVITATION_TTL_HOURS = 48;

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
    select: { id: true },
  });

  if (!artist) {
    throw new Error("ARTIST_NOT_FOUND");
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("ACCOUNT_ALREADY_EXISTS");
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
    throw new Error("INVITATION_ALREADY_EXISTS");
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

  return {
    invitation,
    token,
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
    throw new Error("INVALID_INVITATION");
  }

  if (invitation.acceptedAt) {
    throw new Error("INVITATION_ALREADY_ACCEPTED");
  }

  if (invitation.expiresAt <= new Date()) {
    throw new Error("INVITATION_EXPIRED");
  }

  return invitation;
}

export async function acceptArtistInvitation(token: string, password: string) {
  const invitation = await getInvitationByToken(token);

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new Error("ACCOUNT_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.adminUser.create({
      data: {
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        artistId: invitation.artistId,
        isActive: true,
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
        acceptedAt: new Date(),
      },
    });

    return createdUser;
  });

  return user;
}

export async function getArtistCmsAccess(artistId: number) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true },
  });

  if (!artist) {
    throw new Error("ARTIST_NOT_FOUND");
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
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (invitation.acceptedAt) {
    throw new Error("INVITATION_ALREADY_ACCEPTED");
  }

  await prisma.adminInvitation.delete({
    where: {
      id: invitation.id,
    },
  });
}