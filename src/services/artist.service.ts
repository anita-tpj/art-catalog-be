import { Prisma } from "@prisma/client";
import {
  ArtistListQueryDTO,
  CreateArtistDTO,
  UpdateArtistDTO,
} from "../dtos/artist.dto";
import prisma from "../prisma";

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
  const { page, pageSize, search } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtistWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

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
  return prisma.artist.update({
    where: { id },
    data,
  });
}

export async function deleteArtist(id: number) {
  return prisma.artist.delete({
    where: { id },
  });
}
