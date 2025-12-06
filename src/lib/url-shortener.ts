import { prisma } from "@/lib/db";

interface ShortioResponse {
  id: string | number; // Short.io returns string IDs like "lnk_..."
  shortURL: string;
  originalURL: string;
  domain: string;
  [key: string]: unknown;
}

/**
 * Shortens a URL using the Short.io API
 * @param longUrl - The long URL to shorten
 * @returns Object with shortURL and linkId, or null if shortening fails
 */
export async function shortenUrl(longUrl: string): Promise<{ shortURL: string; linkId: string } | null> {
  try {
    // Get Short.io settings from database
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: "shortio_api_key" },
    });

    const domainSetting = await prisma.setting.findUnique({
      where: { key: "shortio_domain" },
    });

    // If no API key is configured, return null
    if (!apiKeySetting?.value) {
      return null;
    }

    const apiKey = apiKeySetting.value;
    const domain = domainSetting?.value;

    // Domain is required by Short.io API
    if (!domain) {
      console.error("Short.io domain is not configured");
      return null;
    }

    // Prepare request body
    const body: {
      originalURL: string;
      domain: string;
      allowDuplicates: boolean;
    } = {
      originalURL: longUrl,
      domain: domain,
      allowDuplicates: false,
    };

    // Make request to Short.io API
    const response = await fetch("https://api.short.io/links/public", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Short.io API error:", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as ShortioResponse;

    // Return the shortened URL and link ID (convert to string for consistency)
    return data.shortURL && data.id ? { shortURL: data.shortURL, linkId: String(data.id) } : null;
  } catch (error) {
    console.error("Failed to shorten URL:", error);
    return null;
  }
}

/**
 * Deletes a short URL using the Short.io API
 * @param linkId - The Short.io link ID to delete (e.g., "lnk_...")
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteShortUrl(linkId: string): Promise<boolean> {
  try {
    console.log(`[deleteShortUrl] Attempting to delete link ID: ${linkId}`);

    // Get Short.io API key from database
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: "shortio_api_key" },
    });

    if (!apiKeySetting?.value) {
      console.error("[deleteShortUrl] Short.io API key is not configured");
      return false;
    }

    const apiKey = apiKeySetting.value;
    console.log(`[deleteShortUrl] Making DELETE request to Short.io for link ${linkId}`);

    // Call Short.io DELETE API
    const response = await fetch(`https://api.short.io/links/${linkId}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        authorization: apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[deleteShortUrl] Short.io DELETE API error: ${response.status} - ${errorText}`);

      // Treat 404 (not found) as success - link already deleted
      if (response.status === 404) {
        console.log(`[deleteShortUrl] Link ${linkId} not found in Short.io (already deleted)`);
        return true;
      }

      // If DELETE fails with 500 error, try archiving instead
      if (response.status === 500) {
        console.log(`[deleteShortUrl] DELETE failed, trying to archive link instead...`);
        try {
          const archiveResponse = await fetch(`https://api.short.io/links/${linkId}/archive`, {
            method: "POST",
            headers: {
              accept: "application/json",
              authorization: apiKey,
            },
          });

          if (archiveResponse.ok) {
            console.log(`[deleteShortUrl] Successfully archived link ${linkId} from Short.io`);
            return true;
          } else {
            const archiveError = await archiveResponse.text();
            console.error(`[deleteShortUrl] Archive also failed: ${archiveResponse.status} - ${archiveError}`);
          }
        } catch (archiveErr) {
          console.error(`[deleteShortUrl] Archive attempt error:`, archiveErr);
        }
      }

      return false;
    }

    console.log(`[deleteShortUrl] Successfully deleted link ${linkId} from Short.io`);
    return true;
  } catch (error) {
    console.error("[deleteShortUrl] Failed to delete short URL:", error);
    return false;
  }
}
