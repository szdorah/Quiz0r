import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAvatarColor } from "@/lib/scoring";

interface RouteParams {
  params: Promise<{ gameCode: string }>;
}

// POST /api/games/[gameCode]/join - Join a game
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameCode } = await params;
    const body = await request.json();
    const { name, avatarEmoji } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 20) {
      return NextResponse.json(
        { error: "Name must be 20 characters or less" },
        { status: 400 }
      );
    }

    // Find game session
    const gameSession = await prisma.gameSession.findUnique({
      where: { gameCode: gameCode.toUpperCase() },
    });

    if (!gameSession) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    if (gameSession.status !== "WAITING") {
      return NextResponse.json(
        { error: "Game has already started" },
        { status: 400 }
      );
    }

    // Check if name is already taken
    const existingPlayer = await prisma.player.findUnique({
      where: {
        gameSessionId_name: {
          gameSessionId: gameSession.id,
          name: trimmedName,
        },
      },
    });

    if (existingPlayer) {
      // Check admission status for existing players
      if (existingPlayer.admissionStatus === "refused") {
        return NextResponse.json(
          { error: "You have been refused admission to this game" },
          { status: 403 }
        );
      }

      if (existingPlayer.admissionStatus === "pending") {
        return NextResponse.json(
          {
            error: "Your admission is pending host approval",
            playerId: existingPlayer.id,
            status: "pending"
          },
          { status: 403 }
        );
      }

      if (existingPlayer.isActive && existingPlayer.admissionStatus === "admitted") {
        return NextResponse.json(
          { error: "Name is already taken" },
          { status: 400 }
        );
      }

      // Reactivate inactive player (only if admitted)
      if (existingPlayer.admissionStatus === "admitted") {
        const player = await prisma.player.update({
          where: { id: existingPlayer.id },
          data: {
            isActive: true,
            avatarEmoji: avatarEmoji || existingPlayer.avatarEmoji,
          },
        });

        return NextResponse.json({
          playerId: player.id,
          name: player.name,
          avatarColor: player.avatarColor,
          avatarEmoji: player.avatarEmoji,
        });
      }
    }

    // Create new player with appropriate admission status
    const admissionStatus = gameSession.autoAdmit ? "admitted" : "pending";
    console.log(`[API Join] Creating new player "${trimmedName}" in game ${gameCode} with autoAdmit=${gameSession.autoAdmit}, admissionStatus=${admissionStatus}`);
    const player = await prisma.player.create({
      data: {
        gameSessionId: gameSession.id,
        name: trimmedName,
        avatarColor: generateAvatarColor(),
        avatarEmoji: avatarEmoji || null,
        admissionStatus,
      },
    });

    return NextResponse.json(
      {
        playerId: player.id,
        name: player.name,
        avatarColor: player.avatarColor,
        avatarEmoji: player.avatarEmoji,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}
