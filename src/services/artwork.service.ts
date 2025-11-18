import { CreateArtworkDTO, UpdateArtworkDTO } from "../dtos/artwork.dto";
import prisma from "../prisma";

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
