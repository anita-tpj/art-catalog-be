import { AdminRole, ItemStatus, ItemVisibility, Prisma } from "@prisma/client";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  ArtistListQueryDTO,
  CreateArtistDTO,
  UpdateArtistDTO,
} from "../dtos/artist.dto";
import { deleteImage } from "../libs/cloudinary";
import { nullifyUndefined, stripUndefined } from "../libs/prismaData";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

export type ArtistQuery = ArtistListQueryDTO;

export type ArtistAccess = {
  artistId: number | null;
  role?: AdminRole;
};

export async function getAllArtists(access: ArtistAccess) {
  return prisma.artist.findMany({
    where: access.artistId ? { id: access.artistId } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedArtists() {
  return prisma.artist.findMany({
    where: {
      isFeatured: true,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function getArtistById(id: number, access: ArtistAccess) {
  if (access.artistId && access.artistId !== id) {
    return null;
  }

  return prisma.artist.findUnique({
    where: { id },
    include: { artworks: true },
  });
}

export async function getPaginatedArtists(
  query: ArtistQuery,
  access: ArtistAccess,
) {
  const { page, pageSize, search, primaryCategory } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtistWhereInput = access.artistId
    ? { id: access.artistId }
    : {};

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

export async function getPublishedArtists() {
  return prisma.artist.findMany({
    where: {
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedArtistById(id: number) {
  return prisma.artist.findFirst({
    where: {
      id,
      status: ItemStatus.PUBLISHED,
    },
    include: {
      artworks: {
        where: {
          status: ItemStatus.PUBLISHED,
        },
      },
    },
  });
}

export async function getPublishedArtistBySlug(slug: string) {
  const artist = await prisma.artist.findFirst({
    where: {
      slug,
      status: ItemStatus.PUBLISHED,
    },
    include: {
      _count: {
        select: {
          artworks: {
            where: {
              status: ItemStatus.PUBLISHED,
            },
          },
        },
      },
    },
  });

  if (!artist) {
    return null;
  }

  const artworks = await prisma.artwork.findMany({
    where: {
      artistId: artist.id,
      status: ItemStatus.PUBLISHED,
    },
    orderBy: {
      createdAt: "desc",
    },
    ...(artist.visibility === ItemVisibility.PUBLIC ? { take: 6 } : {}),
  });

  const { _count, ...artistData } = artist;

  return {
    ...artistData,
    artworks,
    artworksCount: _count.artworks,
  };
}

export async function getPaginatedPublishedArtists(query: ArtistQuery) {
  const { page, pageSize, search, primaryCategory } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtistWhereInput = {
    status: ItemStatus.PUBLISHED,
    visibility: ItemVisibility.PUBLIC,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  if (primaryCategory) {
    where.primaryCategory = primaryCategory;
  }

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            artworks: {
              where: {
                status: ItemStatus.PUBLISHED,
              },
            },
          },
        },
      },
    }),
    prisma.artist.count({ where }),
  ]);

  const items = artists.map(({ _count, ...artist }) => ({
    ...artist,
    artworksCount: _count.artworks,
  }));

  return {
    items,
    total,
  };
}

const RESERVED_ARTIST_SLUGS = new Set([
  "admin",
  "api",
  "artists",
  "artworks",
  "login",
  "register",
  "contact",
  "dashboard",
  "settings",
]);

function validateArtistSlug(slug: string) {
  if (RESERVED_ARTIST_SLUGS.has(slug)) {
    throw new AppError(ERROR_CODES.ARTIST_SLUG_RESERVED, 400);
  }
}

function requireSlugForPublish(slug: string | null | undefined) {
  if (!slug) {
    throw new AppError(ERROR_CODES.ARTIST_SLUG_REQUIRED_FOR_PUBLISH, 400);
  }
}

export async function createArtist(
  data: CreateArtistDTO,
  access: ArtistAccess,
) {
  if (data.isFeatured !== undefined && access.role !== AdminRole.ADMIN) {
    throw new AppError(ERROR_CODES.ARTIST_FEATURED_ADMIN_ONLY, 403);
  }

  if (data.slug) {
    validateArtistSlug(data.slug);
  }

  const isPublished = data.status === ItemStatus.PUBLISHED;

  if (isPublished) {
    requireSlugForPublish(data.slug);
  }

  const createData = nullifyUndefined({
    ...data,
    slugLocked: isPublished,
  }) as Prisma.ArtistCreateInput;

  try {
    return await prisma.artist.create({
      data: createData,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(ERROR_CODES.ARTIST_SLUG_ALREADY_TAKEN, 409);
    }

    throw err;
  }
}

export async function updateArtist(
  id: number,
  data: UpdateArtistDTO,
  access: ArtistAccess,
) {
  if (
    access.role !== AdminRole.ADMIN &&
    (data.isFeatured !== undefined ||
      data.status !== undefined ||
      data.visibility !== undefined)
  ) {
    throw new AppError(ERROR_CODES.ARTIST_MANAGEMENT_ADMIN_ONLY, 403);
  }

  if (access.artistId && access.artistId !== id) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
  }

  // Fetch current avatarPublicId to decide if we need to delete old image
  const existing = await prisma.artist.findUnique({
    where: { id },
    select: {
      avatarPublicId: true,
      slug: true,
      slugLocked: true,
    },
  });

  if (!existing) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
  }

  if (
    existing.slugLocked &&
    data.slug !== undefined &&
    data.slug !== existing.slug
  ) {
    throw new AppError(ERROR_CODES.ARTIST_SLUG_LOCKED, 400);
  }

  if (data.slug) {
    validateArtistSlug(data.slug);
  }

  const nextSlug = data.slug !== undefined ? data.slug : existing.slug;

  const isFirstPublish =
    !existing.slugLocked && data.status === ItemStatus.PUBLISHED;

  if (isFirstPublish) {
    requireSlugForPublish(nextSlug);
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

  const updateData = stripUndefined({
    ...data,
    ...(isFirstPublish ? { slugLocked: true } : {}),
  }) as Prisma.ArtistUpdateInput;

  try {
    return await prisma.artist.update({
      where: { id },
      data: updateData,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(ERROR_CODES.ARTIST_SLUG_ALREADY_TAKEN, 409);
    }

    throw err;
  }
}

export async function deleteArtist(id: number) {
  const deletedArtist = await prisma.$transaction(async (tx) => {
    const artist = await tx.artist.findUnique({
      where: { id },
      select: {
        id: true,
        avatarPublicId: true,
      },
    });

    if (!artist) {
      throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
    }

    const [artworksCount, adminUsersCount, invitationsCount] =
      await Promise.all([
        tx.artwork.count({
          where: { artistId: id },
        }),
        tx.adminUser.count({
          where: { artistId: id },
        }),
        tx.adminInvitation.count({
          where: {
            artistId: id,
            acceptedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
      ]);

    if (artworksCount > 0) {
      throw new AppError(ERROR_CODES.ARTIST_HAS_ARTWORKS, 409);
    }

    if (adminUsersCount > 0) {
      throw new AppError(ERROR_CODES.ARTIST_HAS_CMS_ACCOUNTS, 409);
    }

    if (invitationsCount > 0) {
      throw new AppError(ERROR_CODES.ARTIST_HAS_INVITATIONS, 409);
    }

    // Delete inquiries associated with this artist
    await tx.inquiry.deleteMany({
      where: { artistId: id },
    });

    return tx.artist.delete({
      where: { id },
    });
  });

  if (deletedArtist.avatarPublicId) {
    try {
      await deleteImage(deletedArtist.avatarPublicId);
    } catch (error) {
      console.error(
        "Error deleting Cloudinary avatar on artist delete:",
        error,
      );
    }
  }

  return deletedArtist;
}
