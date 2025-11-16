import { z } from "zod";

export const createArtistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  country: z.string().optional(),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
});

export const updateArtistSchema = createArtistSchema.partial();

export type CreateArtistDTO = z.infer<typeof createArtistSchema>;
export type UpdateArtistDTO = z.infer<typeof updateArtistSchema>;
