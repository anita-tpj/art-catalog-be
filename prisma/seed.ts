import {
  AdminRole,
  ArtworkCategory,
  ArtworkMotive,
  ArtworkOrientation,
  ArtworkStandardSize,
  ArtworkStyle,
  ArtworkTechnique,
  PrismaClient,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// ---------- Cloudinary config ----------
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optionalEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

cloudinary.config({
  cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: requireEnv("CLOUDINARY_API_KEY"),
  api_secret: requireEnv("CLOUDINARY_API_SECRET"),
});

// Where your local seed assets live:
const ASSETS_DIR = path.join(process.cwd(), "prisma", "seed-assets");

// Upload base folder on Cloudinary:
const CLOUDINARY_BASE_FOLDER = "artcatalog-seed";

type UploadResult = { url: string; publicId: string };

async function uploadImageOrThrow(
  localPath: string,
  publicId: string,
): Promise<UploadResult> {
  if (!existsSync(localPath)) {
    throw new Error(`Seed asset not found: ${localPath}`);
  }

  const res = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    folder: CLOUDINARY_BASE_FOLDER,
    overwrite: true,
    resource_type: "image",
  });

  // res.public_id includes folder prefix (e.g. "artcatalog-seed/artists/ana")
  return { url: res.secure_url, publicId: res.public_id };
}

async function readFileBytes(localPath: string) {
  // Useful if you want to validate file sizes etc. (optional)
  await fs.stat(localPath);
}

async function main() {
  const artistsCount = await prisma.artist.count();
  if (artistsCount > 0) {
    console.log("🌱 Seed skipped (DB already has artists).");
    return;
  }
  console.log("🌱 Seeding database (with Cloudinary uploads)...");

  // 0) Ensure admin user (idempotent)
  const adminEmail = optionalEnv("ADMIN_EMAIL", "admin@artcatalog.local");
  const adminPassword = optionalEnv("ADMIN_PASSWORD", "admin12345");

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Admin ensured: ${adminEmail}`);

  // 1) Cleanup (dev-friendly)
  await prisma.artwork.deleteMany();
  await prisma.artist.deleteMany();

  // 2) Upload avatars
  const anaAvatarPath = path.join(ASSETS_DIR, "artists", "ana.jpg");
  const marcoAvatarPath = path.join(ASSETS_DIR, "artists", "marco.jpg");
  const sofiaAvatarPath = path.join(ASSETS_DIR, "artists", "sofia.jpg");
  const mariaAvatarPath = path.join(ASSETS_DIR, "artists", "maria.jpg");

  await Promise.all([
    readFileBytes(anaAvatarPath),
    readFileBytes(marcoAvatarPath),
    readFileBytes(sofiaAvatarPath),
    readFileBytes(mariaAvatarPath),
  ]);

  const anaAvatar = await uploadImageOrThrow(
    anaAvatarPath,
    "artists/ana-petrovic",
  );
  const marcoAvatar = await uploadImageOrThrow(
    marcoAvatarPath,
    "artists/marco-rossi",
  );
  const sofiaAvatar = await uploadImageOrThrow(
    sofiaAvatarPath,
    "artists/sofia-muller",
  );
  const mariaAvatar = await uploadImageOrThrow(
    mariaAvatarPath,
    "artists/maria-mudra",
  );

  // 3) Create artists
  const artist1 = await prisma.artist.create({
    data: {
      name: "Ana Petrović",
      bio: "Contemporary painter focused on abstract landscapes and color studies.",
      country: "Serbia",
      birthYear: 1985,
      avatarUrl: anaAvatar.url,
      avatarPublicId: anaAvatar.publicId,
      primaryCategory: ArtworkCategory.PAINTING,
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "Marco Rossi",
      bio: "Mixed media and digital artist exploring urban identity.",
      country: "Italy",
      birthYear: 1978,
      avatarUrl: marcoAvatar.url,
      avatarPublicId: marcoAvatar.publicId,
      primaryCategory: ArtworkCategory.DIGITAL_ART,
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Sofia Müller",
      bio: "Photographer working with minimalism and architectural forms.",
      country: "Germany",
      birthYear: 1990,
      avatarUrl: sofiaAvatar.url,
      avatarPublicId: sofiaAvatar.publicId,
      primaryCategory: ArtworkCategory.PHOTOGRAPHY,
    },
  });
  const artist4 = await prisma.artist.create({
    data: {
      name: "Maria Mudra",
      bio: "Photographer working with landscapes.",
      country: "Germany",
      birthYear: 1989,
      avatarUrl: mariaAvatar.url,
      avatarPublicId: mariaAvatar.publicId,
      primaryCategory: ArtworkCategory.PHOTOGRAPHY,
    },
  });

  // 4) Upload artworks
  const artwork1Path = path.join(ASSETS_DIR, "artworks", "artwork1.jpg");
  const artwork2Path = path.join(ASSETS_DIR, "artworks", "artwork2.jpg");
  const artwork3Path = path.join(ASSETS_DIR, "artworks", "artwork3.jpg");
  const artwork4Path = path.join(ASSETS_DIR, "artworks", "artwork4.jpg");
  const artwork5Path = path.join(ASSETS_DIR, "artworks", "artwork5.jpg");
  const artwork6Path = path.join(ASSETS_DIR, "artworks", "artwork6.jpg");
  await Promise.all([
    readFileBytes(artwork1Path),
    readFileBytes(artwork2Path),
    readFileBytes(artwork3Path),
    readFileBytes(artwork4Path),
    readFileBytes(artwork5Path),
    readFileBytes(artwork6Path),
  ]);

  const artwork1 = await uploadImageOrThrow(artwork1Path, "artworks/artwork1");
  const artwork2 = await uploadImageOrThrow(artwork2Path, "artworks/artwork2");
  const artwork3 = await uploadImageOrThrow(artwork3Path, "artworks/artwork3");
  const artwork4 = await uploadImageOrThrow(artwork4Path, "artworks/artwork4");
  const artwork5 = await uploadImageOrThrow(artwork5Path, "artworks/artwork5");
  const artwork6 = await uploadImageOrThrow(artwork6Path, "artworks/artwork6");

  // 5) Create artworks
  await prisma.artwork.createMany({
    data: [
      {
        title: "Silent Horizon",
        year: 2021,
        description: "Abstract interpretation of distant landscapes.",
        imageUrl: artwork1.url,
        imagePublicId: artwork1.publicId,

        technique: ArtworkTechnique.ACRYLIC,
        style: ArtworkStyle.ABSTRACT,
        motive: ArtworkMotive.LANDSCAPE,
        orientation: ArtworkOrientation.LANDSCAPE,
        size: ArtworkStandardSize.SIZE_70x100,
        framed: true,

        category: ArtworkCategory.PAINTING,
        artistId: artist1.id,
      },
      {
        title: "Red Geometry",
        year: 2022,
        description: "Geometric abstraction with strong color contrast.",
        imageUrl: artwork2.url,
        imagePublicId: artwork2.publicId,

        technique: ArtworkTechnique.OIL,
        style: ArtworkStyle.MINIMALISM,
        motive: ArtworkMotive.GEOMETRIC,
        orientation: ArtworkOrientation.SQUARE,
        size: ArtworkStandardSize.SIZE_50x70,
        framed: false,

        category: ArtworkCategory.PAINTING,
        artistId: artist1.id,
      },
      {
        title: "Urban Fragment",
        year: 2023,
        description: "Digital collage inspired by modern city life.",
        imageUrl: artwork3.url,
        imagePublicId: artwork3.publicId,

        technique: ArtworkTechnique.DIGITAL_PAINTING,
        style: ArtworkStyle.CONTEMPORARY,
        motive: ArtworkMotive.CITYSCAPE,
        orientation: ArtworkOrientation.PORTRAIT,
        size: ArtworkStandardSize.A3_29_7x42,
        framed: false,

        category: ArtworkCategory.DIGITAL_ART,
        artistId: artist2.id,
      },
      {
        title: "Concrete Silence",
        year: 2020,
        description: "Minimalist photograph of brutalist architecture.",
        imageUrl: artwork4.url,
        imagePublicId: artwork4.publicId,

        // technique optional for photo in your schema
        style: ArtworkStyle.MINIMALISM,
        motive: ArtworkMotive.CITYSCAPE,
        orientation: ArtworkOrientation.PORTRAIT,
        size: ArtworkStandardSize.A2_42x59_4,
        framed: false,

        category: ArtworkCategory.PHOTOGRAPHY,
        artistId: artist3.id,
      },
      {
        title: "Moon",
        year: 2020,
        description: "Minimalist photograph of nature.",
        imageUrl: artwork5.url,
        imagePublicId: artwork5.publicId,

        // technique optional for photo in your schema
        style: ArtworkStyle.MINIMALISM,
        motive: ArtworkMotive.CITYSCAPE,
        orientation: ArtworkOrientation.PORTRAIT,
        size: ArtworkStandardSize.A2_42x59_4,
        framed: false,

        category: ArtworkCategory.PHOTOGRAPHY,
        artistId: artist4.id,
      },
      {
        title: "Flowers",
        year: 2020,
        description: "Minimalist photograph of flowers.",
        imageUrl: artwork6.url,
        imagePublicId: artwork6.publicId,

        // technique optional for photo in your schema
        style: ArtworkStyle.MINIMALISM,
        motive: ArtworkMotive.CITYSCAPE,
        orientation: ArtworkOrientation.PORTRAIT,
        size: ArtworkStandardSize.A2_42x59_4,
        framed: false,

        category: ArtworkCategory.PHOTOGRAPHY,
        artistId: artist4.id,
      },
    ],
  });

  console.log("✅ Seed complete (Cloudinary + DB).");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
