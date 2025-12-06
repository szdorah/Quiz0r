import { prisma } from "./src/lib/db";

async function listPlayers() {
  const game = await prisma.gameSession.findUnique({
    where: { gameCode: "HLFR7U" },
    include: {
      players: {
        select: {
          name: true,
          admissionStatus: true,
          isActive: true,
        },
      },
    },
  });

  if (!game) {
    console.log("Game HLFR7U not found");
    return;
  }

  console.log(`Game HLFR7U has ${game.players.length} players in database:`);
  for (const player of game.players) {
    console.log(`  - "${player.name}": status=${player.admissionStatus}, active=${player.isActive}`);
  }

  console.log("\n\nTo test admission control, use a player name NOT in this list!");

  await prisma.$disconnect();
}

listPlayers();
