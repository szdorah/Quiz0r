import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOldGames() {
  try {
    // Calculate the cutoff time (1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    console.log(`Deleting games created before: ${oneHourAgo.toISOString()}`);

    // Delete games older than 1 hour
    const result = await prisma.gameSession.deleteMany({
      where: {
        createdAt: {
          lt: oneHourAgo,
        },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} games`);
  } catch (error) {
    console.error("❌ Error deleting games:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldGames();
