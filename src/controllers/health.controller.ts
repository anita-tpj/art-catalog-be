import { Request, Response } from "express";
import cloudinary from "../libs/cloudinary";

export async function checkCloudinary(req: Request, res: Response) {
  try {
    const result = await cloudinary.api.ping();

    res.json({
      ok: true,
      message: "Cloudinary connection OK",
      result,
    });
  } catch (error: any) {
    console.error("Cloudinary health check failed:", error);

    res.status(500).json({
      ok: false,
      message: "Cloudinary connection FAILED",
      error: error?.message ?? "Unknown error",
    });
  }
}
