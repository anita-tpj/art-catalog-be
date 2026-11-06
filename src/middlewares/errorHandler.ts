import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ERROR_CODES } from "../constants/errorCodes";
import logger from "../libs/logger";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        stack: err.stack,
        statusCode: err.statusCode,
        code: err.code,
      });
    }

    return res.status(err.statusCode).json({
      code: err.code,
      message: err.statusCode >= 500 ? "Internal server error" : err.message,
    });
  }

  logger.error(err instanceof Error ? err.message : "Unknown error", {
    stack: err instanceof Error ? err.stack : undefined,
    statusCode: 500,
  });

  return res.status(500).json({
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "Internal server error",
  });
}
