import { Request, Response } from "express";
import cloudinary from "../libs/cloudinary";
import type { UploadApiResponse } from "cloudinary";

async function uploadCloudinaryImage(
  file: Express.Multer.File,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
}

/**
 * Upload Artist Avatar
 */
export async function uploadArtistAvatar(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const folder = process.env.CLOUDINARY_ARTISTS_FOLDER!;
    const result = await uploadCloudinaryImage(file, folder);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Artist upload failed:", err);
    return res.status(500).json({ message: "Failed to upload avatar" });
  }
}

/**
 * Upload Artwork Image
 */
export async function uploadArtworkImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const folder = process.env.CLOUDINARY_ARTWORKS_FOLDER!;
    const result = await uploadCloudinaryImage(file, folder);
    res.status(201).json(result);
  } catch (err) {
    console.error("Artwork upload failed:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
}
