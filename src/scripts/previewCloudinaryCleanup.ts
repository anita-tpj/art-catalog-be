import "dotenv/config";
import prisma from "../prisma";
import { previewCloudinaryCleanup } from "../services/cloudinaryCleanup.service";

async function main() {
  const images = await previewCloudinaryCleanup();

  console.log("\nCloudinary cleanup preview");
  console.log("--------------------------");

  if (images.length === 0) {
    console.log("No images ready for cleanup.");
    return;
  }

  let ready = 0;
  let skipped = 0;

  for (const image of images) {
    if (image.action === "READY_FOR_DELETE") {
      ready++;
    } else {
      skipped++;
    }

    console.log(
      `${image.action} | ${image.publicId} | attempts: ${image.deleteAttempts}`,
    );
  }

  console.log("\nSummary:");
  console.log(`Ready for review: ${ready}`);
  console.log(`Skipped (still in use): ${skipped}`);
  console.log(`Total inspected: ${images.length}`);
}

main()
  .catch(() => {
    console.error("Cloudinary cleanup preview failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
