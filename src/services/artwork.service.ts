import { ArtworkCategory, Prisma } from "@prisma/client";
import {
  CreateArtworkDTO,
  UpdateArtworkDTO,
  ArtworkListQueryDTO,
} from "../dtos/artwork.dto";
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
  });
}

export async function getPaginatedArtworks(query: ArtworkQuery) {
  const { page, pageSize, search, artistId, category } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtworkWhereInput = {};

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

  if (artistId) {
    where.artistId = artistId;
  }

  if (category) {
    where.category = category;
  }

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
  return prisma.artwork.create({
    data,
  });
}

export async function updateArtwork(id: number, data: UpdateArtworkDTO) {
  return prisma.artwork.update({
    where: { id },
    data,
  });
}

export async function deleteArtwork(id: number) {
  return prisma.artwork.delete({
    where: { id },
  });
}
