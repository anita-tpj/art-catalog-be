import { ErrorCode } from "../constants/errorCodes";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}