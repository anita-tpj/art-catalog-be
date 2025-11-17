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

export const updateArtworkSchema = createArtworkSchema.partial();

export type CreateArtworkDTO = z.infer<typeof createArtworkSchema>;
export type UpdateArtworkDTO = z.infer<typeof updateArtworkSchema>;
