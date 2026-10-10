import {
  ArtworkCategory,
  ItemStatus,
  ItemVisibility,
  Prisma,
} from "@prisma/client";
import {
  ArtworkListQueryDTO,
  CreateArtworkDTO,
  UpdateArtworkDTO,
} from "../dtos/artwork.dto";
import { deleteImage } from "../libs/cloudinary";
import { nullifyUndefined, stripUndefined } from "../libs/prismaData";
import prisma from "../prisma";

export type ArtworkQuery = ArtworkListQueryDTO;

export type ArtworkAccess = {
  artistId: number | null;
  adminId?: string;
};

type ArtworkMetadataField =
  | "technique"
  | "medium"
  | "style"
  | "motive"
  | "orientation"
  | "size"
  | "framed";

const CATEGORY_METADATA_FIELDS: Record<
  ArtworkCategory,
  ArtworkMetadataField[]
> = {
  [ArtworkCategory.PAINTING]: [
    "medium",
    "technique",
    "style",
    "motive",
    "orientation",
    "size",
    "framed",
  ],
  [ArtworkCategory.SCULPTURE]: ["medium", "style", "size"],
  [ArtworkCategory.PHOTOGRAPHY]: [
    "medium",
    "style",
    "motive",
    "orientation",
    "size",
  ],
  [ArtworkCategory.DRAWING_ILLUSTRATION]: [
    "medium",
    "technique",
    "style",
    "motive",
    "orientation",
    "size",
    "framed",
  ],
  [ArtworkCategory.PRINTMAKING]: [
    "medium",
    "technique",
    "style",
    "motive",
    "orientation",
    "size",
    "framed",
  ],
  [ArtworkCategory.DIGITAL_ART]: [
    "medium",
    "style",
    "motive",
    "orientation",
    "size",
  ],
  [ArtworkCategory.MIXED_MEDIA]: [
    "medium",
    "technique",
    "style",
    "motive",
    "orientation",
    "size",
    "framed",
  ],
  [ArtworkCategory.TEXTILE_FIBER_ART]: [],
  [ArtworkCategory.CERAMICS]: [],
  [ArtworkCategory.OTHER]: [
    "medium",
    "technique",
    "style",
    "motive",
    "orientation",
    "size",
  ],
};

function normalizeArtworkMetadata(
  data: Record<string, any>,
  category: ArtworkCategory,
) {
  const visibleFields = CATEGORY_METADATA_FIELDS[category];

  const metadataFields: ArtworkMetadataField[] = [
    "technique",
    "medium",
    "style",
    "motive",
    "orientation",
    "size",
    "framed",
  ];

  for (const field of metadataFields) {
    if (!visibleFields.includes(field)) {
      data[field] = field === "framed" ? false : null;
    }
  }

  return data;
}

export async function getAllArtworks(access: ArtworkAccess) {
  return prisma.artwork.findMany({
    where: access.artistId ? { artistId: access.artistId } : {},
    orderBy: { createdAt: "desc" },
    include: { artist: true },
  });
}

export async function getArtworkById(id: number, access: ArtworkAccess) {
  return prisma.artwork.findFirst({
    where: {
      id,
      ...(access.artistId ? { artistId: access.artistId } : {}),
    },
    include: { artist: true },
  });
}

export async function getPaginatedArtworks(
  query: ArtworkQuery,
  access: ArtworkAccess,
) {
  const { page, pageSize, search, artistId, category } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtworkWhereInput = access.artistId
    ? { artistId: access.artistId }
    : {};

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

  if (!access.artistId && artistId) {
    where.artistId = artistId;
  }

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

export async function getAllPublishedArtworks() {
  return prisma.artwork.findMany({
    where: {
      status: ItemStatus.PUBLISHED,
      artist: {
        status: ItemStatus.PUBLISHED,
        visibility: ItemVisibility.PUBLIC,
      },
    },
    orderBy: { createdAt: "desc" },
    include: { artist: true },
  });
}

export async function getPublishedArtworkById(id: number) {
  return prisma.artwork.findFirst({
    where: {
      id,
      status: ItemStatus.PUBLISHED,
      artist: {
        status: ItemStatus.PUBLISHED,
      },
    },
    include: { artist: true },
  });
}

export async function getPaginatedPublishedArtworks(query: ArtworkQuery) {
  const { page, pageSize, search, artist, category } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArtworkWhereInput = {
    status: ItemStatus.PUBLISHED,
    artist: {
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
    },
  };

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        artist: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (artist) {
    where.artist = {
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: artist,
    };
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

export async function createArtwork(
  data: CreateArtworkDTO,
  access: ArtworkAccess,
) {
  const { artistId, copyrightConfirmed, ...rest } = data;

  const targetArtistId = access.artistId ?? artistId;

  if (!access.adminId) {
    throw new Error("Admin ID is required for copyright confirmation");
  }

  const normalizedData = normalizeArtworkMetadata(
    nullifyUndefined({ ...rest }),
    data.category,
  );

  const createData: Prisma.ArtworkCreateInput = {
    ...(normalizedData as unknown as Omit<Prisma.ArtworkCreateInput, "artist">),
    artist: {
      connect: { id: targetArtistId },
    },
    copyrightConfirmedAt: new Date(),
    copyrightConfirmedById: access.adminId,
  };

  return prisma.artwork.create({
    data: createData,
  });
}

export async function updateArtwork(
  id: number,
  data: UpdateArtworkDTO,
  access: ArtworkAccess,
) {
  // Fetch current artwork to compare old vs new Cloudinary image
  // and get its current category for metadata normalization.
  const existing = await prisma.artwork.findFirst({
    where: {
      id,
      ...(access.artistId ? { artistId: access.artistId } : {}),
    },
    select: {
      imagePublicId: true,
      artistId: true,
      category: true,
    },
  });

  if (!existing) {
    const error: any = new Error("Artwork not found");
    error.statusCode = 404;
    throw error;
  }

  const oldPublicId = existing.imagePublicId;
  const newPublicId = data.imagePublicId;

  const shouldDeleteOldImage =
    oldPublicId && newPublicId && oldPublicId !== newPublicId;

  // Build update payload without undefined keys
  const { artistId, ...rest } = data as any;

  const category = data.category ?? existing.category;

  const updateData: any = normalizeArtworkMetadata(
    stripUndefined({ ...rest }),
    category,
  );

  // Only a global admin may reassign an artwork to another artist.
  // Artist-scoped users always keep their existing owner.
  if (!access.artistId && artistId !== undefined) {
    updateData.artist = { connect: { id: artistId } };
  }

  // First update the DB successfully
  const updatedArtwork = await prisma.artwork.update({
    where: { id },
    data: updateData,
  });

  // Only after the DB update succeeds, delete the previous Cloudinary image
  if (shouldDeleteOldImage) {
    try {
      await deleteImage(oldPublicId);
    } catch (err) {
      console.error("Failed to delete previous artwork Cloudinary image:", err);
    }
  }

  return updatedArtwork;
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
