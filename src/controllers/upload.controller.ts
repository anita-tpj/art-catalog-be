import { CloudinaryImageType } from "@prisma/client";
import type { UploadApiResponse } from "cloudinary";
import { Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import cloudinary, { deleteImage } from "../libs/cloudinary";
import type { AdminRequest } from "../middlewares/requireAdmin";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

async function uploadCloudinaryImage(
  file: Express.Multer.File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        type: "private",
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }

        const url = cloudinary.url(result.public_id, {
          secure: true,
          resource_type: "image",
          type: "private",
          transformation: "ca_public_image",
          format: result.format,
          version: result.version,
          sign_url: false,
        });

        resolve({
          url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(file.buffer);
  });
}

/**
 * Upload Artist Avatar
 */
export async function uploadArtistAvatar(req: AdminRequest, res: Response) {
  const file = req.file;

  if (!file) {
    throw new AppError(ERROR_CODES.NO_FILE_UPLOADED, 400, "No file uploaded");
  }

  const folder = process.env.CLOUDINARY_ARTISTS_FOLDER!;
  const result = await uploadCloudinaryImage(file, folder);

  try {
    await prisma.cloudinaryImage.create({
      data: {
        publicId: result.publicId,
        url: result.url,
        uploadedById: req.admin!.id,
        resourceType: CloudinaryImageType.ARTIST_AVATAR,
      },
    });
  } catch (error) {
    console.error("Failed to register Cloudinary artist avatar:", error);

    try {
      await deleteImage(result.publicId);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up unregistered Cloudinary artist avatar:",
        cleanupError,
      );
    }

    throw error;
  }

  return res.status(201).json(result);
}

/**
 * Upload Artwork Image
 */
export async function uploadArtworkImage(req: AdminRequest, res: Response) {
  const file = req.file;

  if (!file) {
    throw new AppError(ERROR_CODES.NO_FILE_UPLOADED, 400, "No file uploaded");
  }

  const folder = process.env.CLOUDINARY_ARTWORKS_FOLDER!;
  const result = await uploadCloudinaryImage(file, folder);

  try {
    await prisma.cloudinaryImage.create({
      data: {
        publicId: result.publicId,
        url: result.url,
        uploadedById: req.admin!.id,
        resourceType: CloudinaryImageType.ARTWORK_IMAGE,
      },
    });
  } catch (error) {
    console.error("Failed to register Cloudinary artwork image:", error);

    try {
      await deleteImage(result.publicId);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up unregistered Cloudinary artwork image:",
        cleanupError,
      );
    }

    throw error;
  }

  return res.status(201).json(result);
}
