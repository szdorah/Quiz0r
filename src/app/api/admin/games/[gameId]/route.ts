import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const game = await prisma.gameSession.findUnique({
      where: { id: params.gameId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        players: {
          where: {
            isActive: true,
            admissionStatus: "admitted"
          },
          orderBy: { totalScore: "desc" },
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarEmoji: true,
            totalScore: true
          }
        },
        _count: {
          select: {
            players: {
              where: {
                isActive: true,
                admissionStatus: "admitted"
              }
            }
          }
        }
      }
    });

    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    return Response.json({
      id: game.id,
      gameCode: game.gameCode,
      status: game.status,
      createdAt: game.createdAt.toISOString(),
      endedAt: game.endedAt?.toISOString() || null,
      quiz: game.quiz,
      playerCount: game._count.players,
      allPlayers: game.players.map((p, idx) => ({
        ...p,
        position: idx + 1
      }))
    });
  } catch (error) {
    console.error("Failed to fetch game details:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
