import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startTunnel, stopTunnel } from "@/lib/tunnel";

// Force dynamic - reads from DB
export const dynamic = "force-dynamic";

// GET /api/settings - Get settings and tunnel status
export async function GET() {
  try {
    // Get ngrok token (masked)
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: "ngrok_token" },
    });

    // Get tunnel URL from database (shared state between server and API routes)
    const tunnelSetting = await prisma.setting.findUnique({
      where: { key: "tunnel_url" },
    });

    const hasToken = !!tokenSetting?.value;
    const maskedToken = tokenSetting?.value
      ? `${tokenSetting.value.slice(0, 8)}...${tokenSetting.value.slice(-4)}`
      : null;
    const tunnelUrl = tunnelSetting?.value || null;

    return NextResponse.json({
      ngrokToken: maskedToken,
      hasToken,
      tunnelRunning: !!tunnelUrl,
      tunnelUrl,
    });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings - Save settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ngrokToken } = body;

    if (ngrokToken !== undefined) {
      if (ngrokToken) {
        // Save token
        await prisma.setting.upsert({
          where: { key: "ngrok_token" },
          update: { value: ngrokToken },
          create: { key: "ngrok_token", value: ngrokToken },
        });

        // Auto-start tunnel when token is saved
        try {
          await startTunnel(ngrokToken);
        } catch (err) {
          console.error("Failed to auto-start tunnel:", err);
        }
      } else {
        // Remove token
        await prisma.setting.deleteMany({
          where: { key: "ngrok_token" },
        });
        await stopTunnel();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
