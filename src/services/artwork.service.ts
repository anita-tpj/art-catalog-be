import {
  AdminRole,
  ArtworkCategory,
  CloudinaryImageStatus,
  CloudinaryImageType,
  ItemStatus,
  ItemVisibility,
  Prisma,
} from "@prisma/client";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  ArtworkListQueryDTO,
  CreateArtworkDTO,
  UpdateArtworkDTO,
} from "../dtos/artwork.dto";
import { nullifyUndefined, stripUndefined } from "../libs/prismaData";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";
import { attachCloudinaryImage } from "./cloudinaryImage.service";

export type ArtworkQuery = ArtworkListQueryDTO;

export type ArtworkAccess = {
  artistId: number | null;
  adminId?: string;
  role?: AdminRole;
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

export async function getFeaturedArtworks() {
  return prisma.artwork.findMany({
    where: {
      isFeatured: true,
      status: ItemStatus.PUBLISHED,
      artist: {
        status: ItemStatus.PUBLISHED,
        visibility: ItemVisibility.PUBLIC,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
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

  if (data.isFeatured !== undefined && access.role !== AdminRole.ADMIN) {
    throw new AppError(ERROR_CODES.ARTWORK_FEATURED_ADMIN_ONLY, 403);
  }

  const targetArtistId = access.artistId ?? artistId;

  if (!access.adminId) {
    throw new Error("Admin ID is required for copyright confirmation");
  }

  const adminId = access.adminId;

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
    copyrightConfirmedById: adminId,
  };

  return prisma.$transaction(async (tx) => {
    if (data.imagePublicId) {
      if (!data.imageUrl) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          403,
          "Artwork image URL is required",
        );
      }

      await attachCloudinaryImage(
        tx,
        data.imagePublicId,
        data.imageUrl,
        adminId,
        CloudinaryImageType.ARTWORK_IMAGE,
      );
    }

    return tx.artwork.create({
      data: createData,
    });
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
    throw new AppError(ERROR_CODES.ARTWORK_NOT_FOUND, 404);
  }

  const imageProvided =
    data.imageUrl !== undefined || data.imagePublicId !== undefined;

  const removingImage = data.imageUrl === null && data.imagePublicId === null;

  if (imageProvided && !removingImage) {
    if (!data.imageUrl || !data.imagePublicId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        403,
        "Image URL and public ID must be provided together",
      );
    }

    if (data.imagePublicId === existing.imagePublicId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        403,
        "Existing image cannot be reassigned",
      );
    }
  }

  const oldPublicId = existing.imagePublicId;
  const newPublicId = data.imagePublicId;

  // Build update payload without undefined keys
  const { artistId, ...rest } = data as any;

  const category = data.category ?? existing.category;

  if (data.isFeatured !== undefined && access.role !== AdminRole.ADMIN) {
    throw new AppError(ERROR_CODES.ARTWORK_FEATURED_ADMIN_ONLY, 403);
  }

  const updateData: any = normalizeArtworkMetadata(
    stripUndefined({ ...rest }),
    category,
  );

  // Only a global admin may reassign an artwork to another artist.
  // Artist-scoped users always keep their existing owner.
  if (!access.artistId && artistId !== undefined) {
    updateData.artistId = artistId;
  }

  // Atomically update artwork and Cloudinary image tracking
  return prisma.$transaction(async (tx) => {
    const imageChanged =
      newPublicId !== undefined && newPublicId !== oldPublicId;

    if (imageChanged && newPublicId) {
      if (!access.adminId) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          401,
          "Admin ID is required",
        );
      }

      if (!data.imageUrl) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          403,
          "Artwork image URL is required",
        );
      }

      await attachCloudinaryImage(
        tx,
        newPublicId,
        data.imageUrl,
        access.adminId,
        CloudinaryImageType.ARTWORK_IMAGE,
      );
    }

    const result = await tx.artwork.updateMany({
      where: {
        id,
        imagePublicId: oldPublicId,
        ...(access.artistId ? { artistId: access.artistId } : {}),
      },
      data: updateData,
    });

    if (result.count !== 1) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        409,
        "Artwork was modified by another request. Please reload and try again.",
      );
    }

    const updatedArtwork = await tx.artwork.findUniqueOrThrow({
      where: { id },
    });

    if (imageProvided && oldPublicId && (imageChanged || removingImage)) {
      await tx.cloudinaryImage.updateMany({
        where: {
          publicId: oldPublicId,
          resourceType: CloudinaryImageType.ARTWORK_IMAGE,
          status: CloudinaryImageStatus.ATTACHED,
        },
        data: {
          status: CloudinaryImageStatus.PENDING_DELETE,
          nextRetryAt: new Date(),
        },
      });
    }

    return updatedArtwork;
  });
}

export async function deleteArtwork(id: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.artwork.findUnique({
      where: { id },
      select: { imagePublicId: true },
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.ARTWORK_NOT_FOUND, 404);
    }

    const deletedArtwork = await tx.artwork.delete({
      where: { id },
    });

    if (existing.imagePublicId) {
      await tx.cloudinaryImage.updateMany({
        where: {
          publicId: existing.imagePublicId,
          resourceType: CloudinaryImageType.ARTWORK_IMAGE,
          status: CloudinaryImageStatus.ATTACHED,
        },
        data: {
          status: CloudinaryImageStatus.PENDING_DELETE,
          nextRetryAt: new Date(),
        },
      });
    }

    return deletedArtwork;
  });
}
