import { z } from "zod";

export const CreateContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(4000),
});

export type CreateContactMessageDTO = z.infer<
  typeof CreateContactMessageSchema
>;