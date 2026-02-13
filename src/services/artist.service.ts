import { Prisma } from "@prisma/client";
import {
  ArtistListQueryDTO,
  CreateArtistDTO,
  UpdateArtistDTO,
} from "../dtos/artist.dto";
import prisma from "../prisma";
import { deleteImage } from "../libs/cloudinary";

export type ArtistQuery = ArtistListQueryDTO;

export async function getAllArtists() {
  return prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getArtistById(id: number) {
  return prisma.artist.findUnique({
    where: { id },
    include: { artworks: true },
  });
}

export async function getPaginatedArtists(query: ArtistQuery) {
  const { page, pageSize, search, primaryCategory } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtistWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  if (primaryCategory) where.primaryCategory = primaryCategory;

  const [items, total] = await Promise.all([
    prisma.artist.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: "desc" },
      include: { artworks: true },
    }),
    prisma.artist.count({ where }),
  ]);

  return {
    items,
    total,
  };
}

export async function createArtist(data: CreateArtistDTO) {
  return prisma.artist.create({
    data,
  });
}

export async function updateArtist(id: number, data: UpdateArtistDTO) {
  // Fetch current avatarPublicId to decide if we need to delete old image
  const existing = await prisma.artist.findUnique({
    where: { id },
    select: {
      avatarPublicId: true,
    },
  });

  if (!existing) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  const shouldDeleteOldAvatar =
    existing.avatarPublicId &&
    data.avatarPublicId &&
    existing.avatarPublicId !== data.avatarPublicId;

  if (shouldDeleteOldAvatar && existing.avatarPublicId != null) {
    try {
      await deleteImage(existing.avatarPublicId);
    } catch (err) {
      console.error("Error deleting old Cloudinary avatar:", err);
    }
  }

  return prisma.artist.update({
    where: { id },
    data,
  });
}

export async function deleteArtist(id: number) {
  // Optional but nice: delete avatar from Cloudinary on artist delete
  const existing = await prisma.artist.findUnique({
    where: { id },
    select: {
      avatarPublicId: true,
    },
  });

  if (existing?.avatarPublicId) {
    try {
      await deleteImage(existing.avatarPublicId);
    } catch (err) {
      console.error("Error deleting Cloudinary avatar on artist delete:", err);
    }
  }

  return prisma.artist.delete({
    where: { id },
  });
}
