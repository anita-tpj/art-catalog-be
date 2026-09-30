import type { Request, Response } from "express";
import { CreateContactMessageSchema } from "../dtos/contact.dto";
import { sendContactEmail } from "../services/contactEmail.service";

export async function createContactMessage(req: Request, res: Response) {
  const parsed = CreateContactMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      issues: parsed.error.issues,
    });
  }

  await sendContactEmail(parsed.data);

  return res.status(200).json({
    message: "Message sent",
  });
}