import { z } from "zod";

export const createArtistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  country: z.string().optional(),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
});

export const ArtistListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().min(1).max(100).optional(),
});

export const updateArtistSchema = createArtistSchema.partial();

export type CreateArtistDTO = z.infer<typeof createArtistSchema>;
export type UpdateArtistDTO = z.infer<typeof updateArtistSchema>;
export type ArtistListQueryDTO = z.infer<typeof ArtistListQuerySchema>;
