import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma";
import artistsRouter from "./routes/artists.routes";
import artworkRouter from "./routes/artwork.routes";
import uploadRouter from "./routes/upload.routes";
import healthRouter from "./routes/health.routes";
import inquiriesRouter from "./routes/inquiries.routes";
import "express-async-errors";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./libs/logger";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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
