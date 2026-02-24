import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import logger from "./libs/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { requireRoles } from "./middlewares/requireAdmin";
import adminDashBoardRouter from "./routes/adminDashboard.routes";
import artistsRouter from "./routes/artists.routes";
import artworkRouter from "./routes/artwork.routes";
import authAdminRouter from "./routes/authAdmin.routes";
import healthRouter from "./routes/health.routes";
import inquiriesRouter from "./routes/inquiries.routes";
import uploadRouter from "./routes/upload.routes";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

// Middleware
app.use(
  cors({
    origin: (origin, cb) => {
      // allow Postman / curl (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authAdminRouter);

app.use("/api/admin/dashboard", requireRoles(["ADMIN"]), adminDashBoardRouter);
app.use("/api/artists", artistsRouter);
app.use("/api/artworks", artworkRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/health", healthRouter);
app.use(errorHandler);

app.get("/", (_req, res) => {
  res.send("ArtCatalog API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
