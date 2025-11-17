import { CreateArtworkDTO, UpdateArtworkDTO } from "../dtos/artwork.dto";
import prisma from "../prisma";

export async function getAllArtWorks() {
  return prisma.artwork.findMany({
    orderBy: { createdAt: "desc" },
    include: { artist: true },
  });
}

export async function getArtWorkById(id: number) {
  return prisma.artwork.findUnique({
    where: { id },
  });
}

export async function createArtWork(data: CreateArtworkDTO) {
  return prisma.artwork.create({
    data,
  });
}

export async function updateArtWork(id: number, data: UpdateArtworkDTO) {
  return prisma.artwork.update({
    where: { id },
    data,
  });
}

export async function deleteArtWork(id: number) {
  return prisma.artwork.delete({
    where: { id },
  });
}
