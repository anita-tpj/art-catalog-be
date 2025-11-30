import { ArtworkCategory } from "@prisma/client";
import { z } from "zod";

export const createArtworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  year: z.number().int().optional(),
  artistId: z.number().int(),
  category: z.nativeEnum(ArtworkCategory),
});

export const ArtworkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce.number().int().min(1).max(50).default(10),

  search: z.string().trim().min(1).max(100).optional(),

  artistId: z.coerce.number().int().positive().optional(),

  category: z.nativeEnum(ArtworkCategory).optional(),
});

export const updateArtworkSchema = createArtworkSchema.partial();

export type CreateArtworkDTO = z.infer<typeof createArtworkSchema>;
export type UpdateArtworkDTO = z.infer<typeof updateArtworkSchema>;
export type ArtworkListQueryDTO = z.infer<typeof ArtworkListQuerySchema>;
