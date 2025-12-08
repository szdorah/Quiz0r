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

    // Get Short.io settings
    const shortioApiKeySetting = await prisma.setting.findUnique({
      where: { key: "shortio_api_key" },
    });

    const shortioDomainSetting = await prisma.setting.findUnique({
      where: { key: "shortio_domain" },
    });

    // Get OpenAI settings
    const openaiApiKeySetting = await prisma.setting.findUnique({
      where: { key: "openai_api_key" },
    });

    // Get Unsplash settings
    const unsplashApiKeySetting = await prisma.setting.findUnique({
      where: { key: "unsplash_api_key" },
    });

    const hasToken = !!tokenSetting?.value;
    const maskedToken = tokenSetting?.value
      ? `${tokenSetting.value.slice(0, 8)}...${tokenSetting.value.slice(-4)}`
      : null;
    const tunnelUrl = tunnelSetting?.value || null;

    const hasShortioApiKey = !!shortioApiKeySetting?.value;
    const maskedShortioApiKey = shortioApiKeySetting?.value
      ? `${shortioApiKeySetting.value.slice(0, 8)}...${shortioApiKeySetting.value.slice(-4)}`
      : null;
    const shortioDomain = shortioDomainSetting?.value || null;

    const hasOpenaiApiKey = !!openaiApiKeySetting?.value;
    const maskedOpenaiApiKey = openaiApiKeySetting?.value
      ? `${openaiApiKeySetting.value.slice(0, 8)}...${openaiApiKeySetting.value.slice(-4)}`
      : null;
    const hasUnsplashApiKey = !!unsplashApiKeySetting?.value;
    const maskedUnsplashApiKey = unsplashApiKeySetting?.value
      ? `${unsplashApiKeySetting.value.slice(0, 8)}...${unsplashApiKeySetting.value.slice(-4)}`
      : null;

    return NextResponse.json({
      ngrokToken: maskedToken,
      hasToken,
      tunnelRunning: !!tunnelUrl,
      tunnelUrl,
      shortioApiKey: maskedShortioApiKey,
      hasShortioApiKey,
      shortioDomain,
      openaiApiKey: maskedOpenaiApiKey,
      hasOpenaiApiKey,
      unsplashApiKey: maskedUnsplashApiKey,
      hasUnsplashApiKey,
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
    // Normalize incoming values to avoid persisting accidental whitespace/newlines
    const normalize = (value: unknown) =>
      typeof value === "string" ? value.trim() : value;

    const ngrokToken = normalize(body.ngrokToken) as string | undefined;
    const shortioApiKey = normalize(body.shortioApiKey) as string | undefined;
    const shortioDomain = normalize(body.shortioDomain) as string | undefined;
    const openaiApiKey = normalize(body.openaiApiKey) as string | undefined;
    const unsplashApiKey = normalize(body.unsplashApiKey) as string | undefined;

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

    if (shortioApiKey !== undefined) {
      if (shortioApiKey) {
        // Save Short.io API key
        await prisma.setting.upsert({
          where: { key: "shortio_api_key" },
          update: { value: shortioApiKey },
          create: { key: "shortio_api_key", value: shortioApiKey },
        });
      } else {
        // Remove Short.io API key
        await prisma.setting.deleteMany({
          where: { key: "shortio_api_key" },
        });
      }
    }

    if (shortioDomain !== undefined) {
      if (shortioDomain) {
        // Save Short.io domain
        await prisma.setting.upsert({
          where: { key: "shortio_domain" },
          update: { value: shortioDomain },
          create: { key: "shortio_domain", value: shortioDomain },
        });
      } else {
        // Remove Short.io domain
        await prisma.setting.deleteMany({
          where: { key: "shortio_domain" },
        });
      }
    }

    if (openaiApiKey !== undefined) {
      if (openaiApiKey) {
        // Save OpenAI API key
        await prisma.setting.upsert({
          where: { key: "openai_api_key" },
          update: { value: openaiApiKey },
          create: { key: "openai_api_key", value: openaiApiKey },
        });
      } else {
        // Remove OpenAI API key
        await prisma.setting.deleteMany({
          where: { key: "openai_api_key" },
        });
      }
    }

    if (unsplashApiKey !== undefined) {
      if (unsplashApiKey) {
        await prisma.setting.upsert({
          where: { key: "unsplash_api_key" },
          update: { value: unsplashApiKey },
          create: { key: "unsplash_api_key", value: unsplashApiKey },
        });
      } else {
        await prisma.setting.deleteMany({
          where: { key: "unsplash_api_key" },
        });
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
