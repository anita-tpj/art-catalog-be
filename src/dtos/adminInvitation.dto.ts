import { z } from "zod";
import { passwordSchema } from "./password.dto";

export const createAdminInvitationSchema = z.object({
  email: z.string().trim().email().max(200),
});


export type CreateAdminInvitationDto = z.infer<
  typeof createAdminInvitationSchema
>;

export const acceptAdminInvitationSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  termsAccepted: z.literal(true),
});

export type AcceptAdminInvitationDto = z.infer<
  typeof acceptAdminInvitationSchema
>;