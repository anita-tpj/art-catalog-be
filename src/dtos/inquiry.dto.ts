import { z } from "zod";
import { InquiryStatus } from "@prisma/client";

export const createInquirySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Invalid email").max(200),
    message: z.string().trim().min(5, "Message is too short").max(5000),

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
  status: z.nativeEnum(InquiryStatus),
});

export type CreateInquiryDTO = z.infer<typeof createInquirySchema>;
export type InquiryListQueryDTO = z.infer<typeof InquiryListQuerySchema>;
export type UpdateInquiryDTO = z.infer<typeof UpdateInquirySchema>;
