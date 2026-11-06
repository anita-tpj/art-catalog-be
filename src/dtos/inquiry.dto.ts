import { InquiryStatus } from "@prisma/client";
import { z } from "zod";

export const createInquirySchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(100, "Name is too long"),

    email: z
      .string({ error: "Email is required" })
      .trim()
      .min(1, "Email is required")
      .email("Invalid email")
      .max(200, "Email is too long"),

    message: z
      .string({ error: "Message is required" })
      .trim()
      .min(5, "Message is too short")
      .max(5000, "Message is too long"),

    artistId: z.number().int().positive().optional(),
    artworkId: z.number().int().positive().optional(),
  })
  .refine((v) => v.artistId || v.artworkId, {
    message: "Either artistId or artworkId is required",
    path: ["artistId"],
  });

export const InquiryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),

  status: z.nativeEnum(InquiryStatus).optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const UpdateInquirySchema = z.object({
  status: z.nativeEnum(InquiryStatus, {
    error: "Inquiry status is required",
  }),
});

export type CreateInquiryDTO = z.infer<typeof createInquirySchema>;
export type InquiryListQueryDTO = z.infer<typeof InquiryListQuerySchema>;
export type UpdateInquiryDTO = z.infer<typeof UpdateInquirySchema>;
