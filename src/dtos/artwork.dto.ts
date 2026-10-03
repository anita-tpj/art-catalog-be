import {
  ArtworkAvailability,
  ArtworkCategory,
  ArtworkMotive,
  ArtworkOrientation,
  ArtworkStyle,
  ArtworkTechnique,
  ItemStatus,
} from "@prisma/client";
import { z } from "zod";

export const createArtworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  year: z.number().int().optional(),
  medium: z.string().trim().max(200, "Medium is too long").optional(),
  technique: z.nativeEnum(ArtworkTechnique).optional(),
  style: z.nativeEnum(ArtworkStyle).optional(),
  motive: z.nativeEnum(ArtworkMotive).optional(),
  orientation: z.nativeEnum(ArtworkOrientation).optional(),
  size: z.string().trim().max(100, "Size is too long").optional(),
  framed: z.boolean().default(false),
  artistId: z.number().int(),
  category: z.nativeEnum(ArtworkCategory),
  status: z.nativeEnum(ItemStatus).default(ItemStatus.DRAFT),
  availability: z
    .nativeEnum(ArtworkAvailability)
    .default(ArtworkAvailability.AVAILABLE),
});

export const ArtworkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  artistId: z.coerce.number().int().positive().optional(),
  artist: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  category: z.nativeEnum(ArtworkCategory).optional(),
});

export const updateArtworkSchema = createArtworkSchema.partial();

export type CreateArtworkDTO = z.infer<typeof createArtworkSchema>;
export type UpdateArtworkDTO = z.infer<typeof updateArtworkSchema>;
export type ArtworkListQueryDTO = z.infer<typeof ArtworkListQuerySchema>;
