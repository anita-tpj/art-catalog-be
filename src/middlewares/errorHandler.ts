import { NextFunction, Request, Response } from "express";
import logger from "../libs/logger";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err.message, {
    stack: err.stack,
    statusCode: err.statusCode || 500,
  });

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Internal server error",
  });
}
