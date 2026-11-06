import { Request, Response } from "express";
import cloudinary from "../libs/cloudinary";

export async function checkCloudinary(_req: Request, res: Response) {
  const result = await cloudinary.api.ping();

  return res.status(200).json({
    ok: true,
    message: "Cloudinary connection OK",
    result,
  });
}
