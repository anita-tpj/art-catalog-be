import { CreateArtistDTO, UpdateArtistDTO } from "../dtos/artist.dto";
import prisma from "../prisma";

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

export async function getPaginatedArtists(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.artist.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { artworks: true },
    }),
    prisma.artist.count(),
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
