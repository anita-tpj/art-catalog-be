import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminId = process.env.COPYRIGHT_ADMIN_ID;

  if (!adminId) {
    throw new Error("COPYRIGHT_ADMIN_ID is required");
  }

  const result = await prisma.artwork.updateMany({
    where: {
      copyrightConfirmedAt: null,
      copyrightConfirmedById: null,
    },
    data: {
      copyrightConfirmedAt: new Date(),
      copyrightConfirmedById: adminId,
    },
  });

  console.log(`Confirmed ${result.count} existing artworks.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
