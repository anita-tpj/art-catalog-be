// prisma/seed.ts

import { ArtworkCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // --- Create Artists ---
  const vanGogh = await prisma.artist.create({
    data: {
      name: "Vincent van Gogh",
      bio: "Dutch post-impressionist painter.",
      country: "Netherlands",
      birthYear: 1853,
      deathYear: 1890,
    },
  });

  const picasso = await prisma.artist.create({
    data: {
      name: "Pablo Picasso",
      bio: "Spanish painter, sculptor, printmaker.",
      country: "Spain",
      birthYear: 1881,
      deathYear: 1973,
    },
  });

  const unknown = await prisma.artist.create({
    data: {
      name: "Unknown Artist",
      bio: "Placeholder artist used for demo artworks.",
      country: "Unknown",
    },
  });

  // --- Create Artworks ---
  await prisma.artwork.createMany({
    data: [
      {
        title: "Starry Night",
        description: "One of Van Gogh's most famous works.",
        year: 1889,
        artistId: vanGogh.id,
        imageUrl: "https://example.com/starry-night.jpg",
        category: ArtworkCategory.PAINTING,
      },
      {
        title: "Sunflowers",
        description: "Still life paintings of sunflowers.",
        year: 1888,
        artistId: vanGogh.id,
        imageUrl: "https://example.com/sunflowers.jpg",
        category: ArtworkCategory.PAINTING,
      },
      {
        title: "Les Demoiselles d'Avignon",
        description: "A large oil painting created by Picasso.",
        year: 1907,
        artistId: picasso.id,
        imageUrl: "https://example.com/demoiselles.jpg",
        category: ArtworkCategory.PAINTING,
      },
      {
        title: "Abstract Digital Study",
        description: "Experimental digital composition with geometric shapes.",
        year: 2022,
        artistId: unknown.id,
        imageUrl: "https://example.com/digital-study.jpg",
        category: ArtworkCategory.DIGITAL,
      },
      {
        title: "Marble Torso",
        description: "Classical style sculpture in marble.",
        year: 1950,
        artistId: unknown.id,
        imageUrl: "https://example.com/marble-torso.jpg",
        category: ArtworkCategory.SCULPTURE,
      },
      {
        title: "Old Town Photography",
        description: "Black and white photograph of an old European town.",
        year: 1998,
        artistId: unknown.id,
        imageUrl: "https://example.com/old-town.jpg",
        category: ArtworkCategory.PHOTOGRAPHY,
      },
    ],
  });

  console.log("🌱 Seed finished!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
