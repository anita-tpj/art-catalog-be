import { Prisma } from "@prisma/client";
import {
  CreateInquiryDTO,
  InquiryListQueryDTO,
  UpdateInquiryDTO,
} from "../dtos/inquiry.dto";
import prisma from "../prisma";

export type InquiryQuery = InquiryListQueryDTO;

export type InquiryAccess = {
  artistId: number | null;
};

export type InquiryStats = {
  allCount: number;
  newCount: number;
  readCount: number;
  archivedCount: number;
};

export async function getAllInquiries(access: InquiryAccess) {
  return prisma.inquiry.findMany({
    where: access.artistId ? { artistId: access.artistId } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaginatedInquiries(
  query: InquiryQuery,
  access: InquiryAccess,
) {
  const { page, pageSize, status, search } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.InquiryWhereInput = access.artistId
    ? { artistId: access.artistId }
    : {};

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
        artist: { select: { id: true, name: true, slug: true } },
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

export async function getInquiryStats(
  access: InquiryAccess,
): Promise<InquiryStats> {
  const baseWhere: Prisma.InquiryWhereInput = access.artistId
    ? { artistId: access.artistId }
    : {};

  const [allCount, newCount, readCount, archivedCount] = await Promise.all([
    prisma.inquiry.count({
      where: baseWhere,
    }),
    prisma.inquiry.count({
      where: {
        ...baseWhere,
        status: "NEW",
      },
    }),
    prisma.inquiry.count({
      where: {
        ...baseWhere,
        status: "READ",
      },
    }),
    prisma.inquiry.count({
      where: {
        ...baseWhere,
        status: "ARCHIVED",
      },
    }),
  ]);

  return {
    allCount,
    newCount,
    readCount,
    archivedCount,
  };
}

export async function getInquiryById(id: number, access: InquiryAccess) {
  return prisma.inquiry.findFirst({
    where: {
      id,
      ...(access.artistId ? { artistId: access.artistId } : {}),
    },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}

export async function createInquiry(data: CreateInquiryDTO) {
  let artistId: number | null = null;
  let artworkId: number | null = null;

  if (data.artworkId) {
    const artwork = await prisma.artwork.findFirst({
      where: {
        id: data.artworkId,
        status: "PUBLISHED",
        artist: {
          status: "PUBLISHED",
        },
      },
      select: {
        id: true,
        artistId: true,
      },
    });

    if (!artwork) {
      const error: any = new Error("Artwork not found");
      error.statusCode = 404;
      throw error;
    }

    artworkId = artwork.id;

    // Artwork is authoritative.
    // Do not trust artistId sent by the browser when artworkId exists.
    artistId = artwork.artistId;
  } else if (data.artistId) {
    const artist = await prisma.artist.findFirst({
      where: {
        id: data.artistId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!artist) {
      const error: any = new Error("Artist not found");
      error.statusCode = 404;
      throw error;
    }

    artistId = artist.id;
  } else {
    const error: any = new Error("Artist or artwork is required");
    error.statusCode = 400;
    throw error;
  }

  return prisma.inquiry.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
      artistId,
      artworkId,
    },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}

export async function updateInquiry(
  id: number,
  data: UpdateInquiryDTO,
  access: InquiryAccess,
) {
  const existing = await prisma.inquiry.findFirst({
    where: {
      id,
      ...(access.artistId ? { artistId: access.artistId } : {}),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    const error: any = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.inquiry.update({
    where: { id },
    data: {
      status: data.status,
    },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      artwork: { select: { id: true, title: true } },
    },
  });
}
