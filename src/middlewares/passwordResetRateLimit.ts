import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { createHash } from "node:crypto";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again later.",
  },
});

export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return ipKeyGenerator(req.ip ?? "0.0.0.0");
    }

    return createHash("sha256").update(email).digest("hex");
  },

  message: {
    message: "Too many password reset requests. Please try again later.",
  },
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many reset attempts. Please try again later.",
  },
});