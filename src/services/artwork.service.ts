import { Prisma } from "@prisma/client";
import {
  ArtworkListQueryDTO,
  CreateArtworkDTO,
  UpdateArtworkDTO,
} from "../dtos/artwork.dto";
import { deleteImage } from "../libs/cloudinary";
import { nullifyUndefined, stripUndefined } from "../libs/prismaData";
import prisma from "../prisma";

export type ArtworkQuery = ArtworkListQueryDTO;

export async function getAllArtworks() {
  return prisma.artwork.findMany({
    orderBy: { createdAt: "desc" },
    include: { artist: true },
  });
}

export async function getArtworkById(id: number) {
  return prisma.artwork.findUnique({
    where: { id },
    include: { artist: true },
  });
}

export async function getPaginatedArtworks(query: ArtworkQuery) {
  const { page, pageSize, search, artistId, category } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtworkWhereInput = {};

  // Search by title or related artist name
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      {
        artist: {
          name: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  if (artistId) where.artistId = artistId;
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.artwork.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: "desc" },
      include: { artist: true },
    }),
    prisma.artwork.count({ where }),
  ]);

  return {
    items,
    total,
  };
}

export async function createArtwork(data: CreateArtworkDTO) {
  const { artistId, ...rest } = data;

  const createData: Prisma.ArtworkCreateInput = {
    ...(nullifyUndefined({ ...rest }) as unknown as Omit<
      Prisma.ArtworkCreateInput,
      "artist"
    >),
    artist: { connect: { id: artistId } },
  };

  return prisma.artwork.create({
    data: createData,
  });
}

export async function updateArtwork(id: number, data: UpdateArtworkDTO) {
  // Fetch current artwork to compare old vs new Cloudinary image
  const existing = await prisma.artwork.findUnique({
    where: { id },
    select: { imagePublicId: true },
  });

  if (!existing) {
    const error: any = new Error("Artwork not found");
    error.statusCode = 404;
    throw error;
  }

  const oldPublicId = existing.imagePublicId;
  const newPublicId = data.imagePublicId;

  // If there is a new image AND it's different than the current one → delete old Cloudinary image
  const shouldDeleteOldImage =
    oldPublicId && newPublicId && oldPublicId !== newPublicId;

  if (shouldDeleteOldImage) {
    try {
      await deleteImage(oldPublicId);
    } catch (err) {
      console.error("Failed to delete previous artwork Cloudinary image:", err);
    }
  }

  // Update the DB record with new fields including new image URL/publicId
  // Build update payload without undefined keys
  // Also handle artist change via relation connect (avoid artistId: never issues)
  const { artistId, ...rest } = data as any;

  const updateData: any = stripUndefined({ ...rest });

  if (artistId !== undefined) {
    updateData.artist = { connect: { id: artistId } };
  }

  return prisma.artwork.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteArtwork(id: number) {
  // Fetch artwork image publicId before deleting DB record
  const existing = await prisma.artwork.findUnique({
    where: { id },
    select: { imagePublicId: true },
  });

  if (!existing) {
    const error: any = new Error("Artwork not found");
    error.statusCode = 404;
    throw error;
  }

  // If Cloudinary image exists → delete remote file
  if (existing.imagePublicId) {
    try {
      await deleteImage(existing.imagePublicId);
    } catch (err) {
      console.error(
        "Failed to delete Cloudinary image on artwork delete:",
        err,
      );
    }
  }

  // Finally delete artwork from DB
  return prisma.artwork.delete({
    where: { id },
  });
}
