import { ArtworkCategory, ItemStatus, ItemVisibility } from "@prisma/client";
import { z } from "zod";

const hasValidImagePair = (
  url: string | undefined,
  publicId: string | undefined,
) => {
  const hasUrl = url !== undefined;
  const hasPublicId = publicId !== undefined;

  return (
    hasUrl === hasPublicId && (!hasPublicId || Boolean(url && publicId?.trim()))
  );
};

const artistBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  country: z.string().optional(),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional(),
  avatarPublicId: z.string().optional(),
  primaryCategory: z.nativeEnum(ArtworkCategory),
  status: z.nativeEnum(ItemStatus).default(ItemStatus.DRAFT),
  visibility: z.nativeEnum(ItemVisibility).default(ItemVisibility.PRIVATE),
  isFeatured: z.boolean().optional(),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can contain only lowercase letters, numbers and single hyphens",
    )
    .nullable()
    .optional(),
});

export const createArtistSchema = artistBaseSchema.refine(
  (data) => hasValidImagePair(data.avatarUrl, data.avatarPublicId),
  {
    message: "Avatar URL and public ID must be provided together",
    path: ["avatarUrl"],
  },
);

export const updateArtistSchema = artistBaseSchema
  .extend({
    avatarUrl: z.string().url("Must be a valid URL").nullable().optional(),
    avatarPublicId: z.string().trim().min(1).nullable().optional(),
  })
  .partial()
  .refine(
    (data) => {
      const { avatarUrl, avatarPublicId } = data;

      if (avatarUrl === undefined && avatarPublicId === undefined) {
        return true;
      }

      if (avatarUrl === null && avatarPublicId === null) {
        return true;
      }

      return (
        typeof avatarUrl === "string" &&
        typeof avatarPublicId === "string" &&
        avatarPublicId.length > 0
      );
    },
    {
      message: "Avatar URL and public ID must be provided together",
      path: ["avatarUrl"],
    },
  );

export const ArtistListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  primaryCategory: z.nativeEnum(ArtworkCategory).optional(),
});

export type CreateArtistDTO = z.infer<typeof createArtistSchema>;
export type UpdateArtistDTO = z.infer<typeof updateArtistSchema>;
export type ArtistListQueryDTO = z.infer<typeof ArtistListQuerySchema>;
