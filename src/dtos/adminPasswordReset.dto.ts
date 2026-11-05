
import { z } from "zod";
import { passwordSchema } from "./password.dto";

export const forgotAdminPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const resetAdminPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: passwordSchema,
});
