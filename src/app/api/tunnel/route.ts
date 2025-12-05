import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic - this route reads from DB and should never be cached
export const dynamic = "force-dynamic";

// GET /api/tunnel - Get the ngrok tunnel URL if available
export async function GET() {
  try {
    // Read tunnel URL from database (set by server.ts when tunnel starts)
    const setting = await prisma.setting.findUnique({
      where: { key: "tunnel_url" },
    });
    return NextResponse.json({ url: setting?.value || null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
