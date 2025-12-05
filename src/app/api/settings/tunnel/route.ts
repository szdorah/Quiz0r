import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startTunnel, stopTunnel, getTunnelUrl, isTunnelRunning } from "@/lib/tunnel";

// GET /api/settings/tunnel - Get tunnel status
export async function GET() {
  return NextResponse.json({
    running: isTunnelRunning(),
    url: getTunnelUrl(),
  });
}

// POST /api/settings/tunnel - Start tunnel
export async function POST() {
  try {
    // Get token from database
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: "ngrok_token" },
    });

    if (!tokenSetting?.value) {
      return NextResponse.json(
        { error: "No ngrok token configured. Please add your token in settings." },
        { status: 400 }
      );
    }

    const url = await startTunnel(tokenSetting.value);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Failed to start tunnel:", error);
    const message = error instanceof Error ? error.message : "Failed to start tunnel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/settings/tunnel - Stop tunnel
export async function DELETE() {
  try {
    await stopTunnel();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to stop tunnel:", error);
    return NextResponse.json(
      { error: "Failed to stop tunnel" },
      { status: 500 }
    );
  }
}
