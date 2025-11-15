import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (_req, res) => {
  res.send("ArtCatalog API running");
});

app.get("/api/artists", async (_req, res) => {
  try {
    const artists = await prisma.artist.findMany();
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching artists");
  }
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
