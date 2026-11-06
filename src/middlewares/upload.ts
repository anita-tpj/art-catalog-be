import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "../utils/AppError";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new AppError(
          ERROR_CODES.INVALID_FILE_TYPE,
          400,
          "Only JPG, PNG and WebP images are allowed",
        ),
      );
    }

    callback(null, true);
  },
}).single("file");

export function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  storage(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            ERROR_CODES.FILE_TOO_LARGE,
            413,
            "Image must be smaller than 5 MB",
          ),
        );
      }

      return next(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          400,
          "Invalid upload request",
        ),
      );
    }

    if (error) {
      return next(error);
    }

    next();
  });
}
