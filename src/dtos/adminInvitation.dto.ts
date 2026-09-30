import { z } from "zod";

export const createAdminInvitationSchema = z.object({
  email: z.string().trim().email().max(200),
});


export type CreateAdminInvitationDto = z.infer<
  typeof createAdminInvitationSchema
>;

export const acceptAdminInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export type AcceptAdminInvitationDto = z.infer<
  typeof acceptAdminInvitationSchema
>;