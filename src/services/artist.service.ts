import { ItemStatus, ItemVisibility, Prisma } from "@prisma/client";
import {
  ArtistListQueryDTO,
  CreateArtistDTO,
  UpdateArtistDTO,
} from "../dtos/artist.dto";
import { deleteImage } from "../libs/cloudinary";
import { nullifyUndefined, stripUndefined } from "../libs/prismaData";
import prisma from "../prisma";

export type ArtistQuery = ArtistListQueryDTO;

export type ArtistAccess = {
  artistId: number | null;
};

export async function getAllArtists(access: ArtistAccess) {
  return prisma.artist.findMany({
    where: access.artistId ? { id: access.artistId } : {},
    orderBy: { createdAt: "desc" },
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
    const error: any = new Error("This slug is reserved");
    error.statusCode = 400;
    throw error;
  }
}

function requireSlugForPublish(slug: string | null | undefined) {
  if (!slug) {
    const error: any = new Error(
      "Artist must have a slug before being published",
    );
    error.statusCode = 400;
    throw error;
  }
}

export async function createArtist(data: CreateArtistDTO) {
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
      const error: any = new Error("This slug is already taken");
      error.statusCode = 409;
      throw error;
    }

    throw err;
  }
}

export async function updateArtist(
  id: number,
  data: UpdateArtistDTO,
  access: ArtistAccess,
) {
  if (access.artistId && access.artistId !== id) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
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
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    existing.slugLocked &&
    data.slug !== undefined &&
    data.slug !== existing.slug
  ) {
    const error: any = new Error(
      "Slug cannot be changed after the artist has been published",
    );
    error.statusCode = 400;
    throw error;
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
      const error: any = new Error("This slug is already taken");
      error.statusCode = 409;
      throw error;
    }

    throw err;
  }
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
