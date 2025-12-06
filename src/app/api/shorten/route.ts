import { NextResponse } from "next/server";
import { shortenUrl } from "@/lib/url-shortener";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/shorten - Retrieve existing short URL for a game code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawGameCode = searchParams.get("gameCode");

    if (!rawGameCode) {
      return NextResponse.json({ shortUrl: null });
    }

    // Normalize game code to uppercase to match storage
    const gameCode = rawGameCode.toUpperCase();

    // Retrieve the stored short URL
    const setting = await prisma.setting.findUnique({
      where: { key: `shortio_url_${gameCode}` },
    });

    return NextResponse.json({
      shortUrl: setting?.value || null,
    });
  } catch (error) {
    console.error("Failed to retrieve short URL:", error);
    return NextResponse.json({ shortUrl: null });
  }
}

// POST /api/shorten - Shorten a URL (only called by display page)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, gameCode: rawGameCode } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!rawGameCode) {
      // If no game code, just shorten the URL without caching
      const result = await shortenUrl(url);
      return NextResponse.json({
        shortUrl: result?.shortURL || null,
        linkId: result?.linkId || null,
        originalUrl: url,
        cached: false,
      });
    }

    // Normalize game code to uppercase to match game-manager
    const gameCode = rawGameCode.toUpperCase();
    console.log(`[Shorten] Processing request for game code: ${gameCode}`);

    // Check if we already have a short URL for this game
    const existingSetting = await prisma.setting.findUnique({
      where: { key: `shortio_url_${gameCode}` },
    });

    if (existingSetting?.value) {
      // Return the existing short URL
      const linkIdSetting = await prisma.setting.findUnique({
        where: { key: `shortio_link_${gameCode}` },
      });

      console.log(`[Shorten] Using cached URL for ${gameCode}: ${existingSetting.value}`);
      return NextResponse.json({
        shortUrl: existingSetting.value,
        linkId: linkIdSetting?.value || null,
        originalUrl: url,
        cached: true,
      });
    }

    // Create the short URL
    console.log(`[Shorten] Creating new short URL for ${gameCode}`);
    const result = await shortenUrl(url);

    if (result) {
      // Store the link ID and short URL (linkId is already a string)
      await prisma.setting.upsert({
        where: { key: `shortio_link_${gameCode}` },
        update: { value: result.linkId },
        create: { key: `shortio_link_${gameCode}`, value: result.linkId },
      });

      await prisma.setting.upsert({
        where: { key: `shortio_url_${gameCode}` },
        update: { value: result.shortURL },
        create: { key: `shortio_url_${gameCode}`, value: result.shortURL },
      });

      console.log(`[Shorten] Stored short URL for ${gameCode}: ${result.shortURL} (ID: ${result.linkId})`);
    }

    // Return the shortened URL or null if shortening failed
    return NextResponse.json({
      shortUrl: result?.shortURL || null,
      linkId: result?.linkId || null,
      originalUrl: url,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to shorten URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL", shortUrl: null },
      { status: 500 }
    );
  }
}

// DELETE /api/shorten - Delete a short URL
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { gameCode: rawGameCode } = body;

    if (!rawGameCode) {
      return NextResponse.json(
        { error: "Game code is required" },
        { status: 400 }
      );
    }

    // Normalize game code to uppercase to match game-manager
    const gameCode = rawGameCode.toUpperCase();
    console.log(`[Shorten DELETE] Processing deletion for game code: ${gameCode} (original: ${rawGameCode})`);

    // Get the stored link ID
    const linkIdSetting = await prisma.setting.findUnique({
      where: { key: `shortio_link_${gameCode}` },
    });

    if (!linkIdSetting?.value) {
      console.log(`[Shorten DELETE] No link ID found for ${gameCode}, nothing to delete`);
      return NextResponse.json({ success: true }); // Nothing to delete
    }

    console.log(`[Shorten DELETE] Found link ID: ${linkIdSetting.value}`);
    const linkId = linkIdSetting.value;

    if (!linkId) {
      console.error(`[Shorten DELETE] Invalid link ID: ${linkIdSetting.value}`);
      return NextResponse.json(
        { error: "Invalid link ID" },
        { status: 500 }
      );
    }

    console.log(`[Shorten DELETE] Deleting Short.io link with ID: ${linkId}`);

    // Delete from Short.io
    const { deleteShortUrl } = await import("@/lib/url-shortener");
    const deleted = await deleteShortUrl(linkId);

    if (deleted) {
      console.log(`[Shorten DELETE] Successfully deleted Short.io link ${linkId}`);
    } else {
      console.error(`[Shorten DELETE] Failed to delete Short.io link ${linkId}`);
    }

    // Delete from database regardless of Short.io deletion result
    await prisma.setting.deleteMany({
      where: {
        key: {
          in: [`shortio_link_${gameCode}`, `shortio_url_${gameCode}`],
        },
      },
    });

    console.log(`[Shorten DELETE] Deleted database entries for ${gameCode}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete short URL:", error);
    return NextResponse.json(
      { error: "Failed to delete short URL" },
      { status: 500 }
    );
  }
}
