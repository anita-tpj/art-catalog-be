import {
  CloudinaryImageStatus,
  CloudinaryImageType,
  Prisma,
} from "@prisma/client";
import prisma from "../prisma";

type LegacyImage = {
  recordId: number;
  publicId: string;
  url: string;
  resourceType: CloudinaryImageType;
};

async function main() {
  const apply = process.argv.includes("--apply");

  const [artists, artworks, trackedImages] = await Promise.all([
    prisma.artist.findMany({
      select: {
        id: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    }),
    prisma.artwork.findMany({
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
      },
    }),
    prisma.cloudinaryImage.findMany({
      select: { publicId: true },
    }),
  ]);

  const trackedIds = new Set(trackedImages.map((image) => image.publicId));

  const images: LegacyImage[] = [
    ...artists.flatMap((artist) =>
      artist.avatarUrl && artist.avatarPublicId
        ? [
            {
              recordId: artist.id,
              publicId: artist.avatarPublicId,
              url: artist.avatarUrl,
              resourceType: CloudinaryImageType.ARTIST_AVATAR,
            },
          ]
        : [],
    ),
    ...artworks.flatMap((artwork) =>
      artwork.imageUrl && artwork.imagePublicId
        ? [
            {
              recordId: artwork.id,
              publicId: artwork.imagePublicId,
              url: artwork.imageUrl,
              resourceType: CloudinaryImageType.ARTWORK_IMAGE,
            },
          ]
        : [],
    ),
  ];

  // Never backfill ambiguous image references.
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const image of images) {
    if (seen.has(image.publicId)) {
      duplicates.add(image.publicId);
    }
    seen.add(image.publicId);
  }

  if (duplicates.size > 0) {
    console.error("Duplicate publicIds detected:", [...duplicates]);
    throw new Error("Backfill aborted: duplicate image references.");
  }

  // Detect incomplete image pairs.
  const incompleteArtists = artists.filter(
    (artist) => Boolean(artist.avatarUrl) !== Boolean(artist.avatarPublicId),
  );

  const incompleteArtworks = artworks.filter(
    (artwork) => Boolean(artwork.imageUrl) !== Boolean(artwork.imagePublicId),
  );

  if (incompleteArtists.length || incompleteArtworks.length) {
    console.error("Incomplete artist image pairs:", incompleteArtists);
    console.error("Incomplete artwork image pairs:", incompleteArtworks);
    throw new Error("Backfill aborted: incomplete image references.");
  }

  const missing = images.filter((image) => !trackedIds.has(image.publicId));

  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Artists: ${artists.length}`);
  console.log(`Artworks: ${artworks.length}`);
  console.log(`Already tracked: ${trackedIds.size}`);
  console.log(`Missing images: ${missing.length}`);

  console.table(
    missing.map(({ recordId, publicId, resourceType }) => ({
      recordId,
      publicId,
      resourceType,
      status: CloudinaryImageStatus.ATTACHED,
    })),
  );

  if (!apply) {
    console.log("DRY RUN — no database changes made.");
    console.log("Run with --apply to register missing images.");
    return;
  }

  if (missing.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  const result = await prisma.$transaction(
    async (tx) => {
      // Recheck live references inside the transaction.
      for (const image of missing) {
        const stillReferenced =
          image.resourceType === CloudinaryImageType.ARTIST_AVATAR
            ? await tx.artist.count({
                where: {
                  id: image.recordId,
                  avatarPublicId: image.publicId,
                  avatarUrl: image.url,
                },
              })
            : await tx.artwork.count({
                where: {
                  id: image.recordId,
                  imagePublicId: image.publicId,
                  imageUrl: image.url,
                },
              });

        if (stillReferenced !== 1) {
          throw new Error(
            `Image reference changed during backfill: ${image.publicId}`,
          );
        }
      }

      return tx.cloudinaryImage.createMany({
        data: missing.map((image) => ({
          publicId: image.publicId,
          url: image.url,
          resourceType: image.resourceType,
          status: CloudinaryImageStatus.ATTACHED,
          uploadedById: null,
        })),
        skipDuplicates: true,
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    },
  );

  console.log(`Successfully registered: ${result.count}`);
  console.log("No Cloudinary assets were uploaded or deleted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
