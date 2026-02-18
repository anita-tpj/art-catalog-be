import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import {
  CreateInquiryDTO,
  InquiryListQueryDTO,
  UpdateInquiryDTO,
} from "../dtos/inquiry.dto";

export type InquiryQuery = InquiryListQueryDTO;

export type InquiryStats = {
  allCount: number;
  newCount: number;
  readCount: number;
  archivedCount: number;
};

export async function getAllInquiries() {
  return prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaginatedInquiries(query: InquiryQuery) {
  const { page, pageSize, status, search } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.InquiryWhereInput = {};

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
      { artwork: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        artist: { select: { id: true, name: true } },
        artwork: { select: { id: true, title: true } },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    items,
    total,
  };
}

export async function getInquiryStats(): Promise<InquiryStats> {
  const [allCount, newCount, readCount, archivedCount] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({ where: { status: "READ" } }),
    prisma.inquiry.count({ where: { status: "ARCHIVED" } }),
  ]);

  return {
    allCount,
    newCount,
    readCount,
    archivedCount,
  };
}

export async function getInquiryById(id: number) {
  return prisma.inquiry.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}

export async function createInquiry(data: CreateInquiryDTO) {
  return prisma.inquiry.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
      artistId: data.artistId ?? null,
      artworkId: data.artworkId ?? null,
    },
    include: {
      artist: { select: { id: true, name: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}

export async function updateInquiry(id: number, data: UpdateInquiryDTO) {
  return prisma.inquiry.update({
    where: { id },
    data: { status: data.status },
    include: {
      artist: { select: { id: true, name: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}
