import type { Request, Response } from "express";
import { CreateContactMessageSchema } from "../dtos/contact.dto";
import { sendContactEmail } from "../services/contactEmail.service";

export async function createContactMessage(req: Request, res: Response) {
  const data = CreateContactMessageSchema.parse(req.body);

  await sendContactEmail(data);

  return res.status(200).json({
    message: "Message sent",
  });
}
