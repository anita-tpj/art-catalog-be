import {
  CloudinaryImageStatus,
  CloudinaryImageType,
  Prisma,
} from "@prisma/client";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "../utils/AppError";

type TransactionClient = Prisma.TransactionClient;

export async function attachCloudinaryImage(
  tx: TransactionClient,
  publicId: string,
  url: string,
  uploadedById: string,
  resourceType: CloudinaryImageType,
) {
  if (!publicId || !url) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      403,
      "Image publicId and URL are required",
    );
  }

  const result = await tx.cloudinaryImage.updateMany({
    where: {
      publicId,
      url,
      uploadedById,
      resourceType,
      status: CloudinaryImageStatus.TEMPORARY,
    },
    data: {
      status: CloudinaryImageStatus.ATTACHED,
    },
  });

  if (result.count !== 1) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      403,
      "Image is not available for attachment",
    );
  }
}
