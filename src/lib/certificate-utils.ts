import { format } from "date-fns";

/**
 * Sanitize a string for use in filenames
 * Removes special characters and limits length
 */
export function sanitizeFilename(text: string, maxLength: number = 30): string {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, maxLength);
}

/**
 * Convert a number to its ordinal form (1st, 2nd, 3rd, etc.)
 */
export function ordinalNumber(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Truncate text with ellipsis if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generate a certificate filename
 */
export function getCertificateFilename(
  quizTitle: string,
  playerName: string | null,
  date: Date
): string {
  const sanitizedTitle = sanitizeFilename(quizTitle, 30);
  const dateStr = format(date, "yyyy-MM-dd");

  if (playerName) {
    const sanitizedName = sanitizeFilename(playerName, 20);
    return `${sanitizedTitle}-${sanitizedName}-${dateStr}.jpg`;
  }

  return `${sanitizedTitle}-Leaderboard-${dateStr}.jpg`;
}

/**
 * Extract filename from Content-Disposition header
 */
export function getFilenameFromResponse(response: Response): string {
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const filenameMatch = disposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      return filenameMatch[1];
    }
  }
  return `certificate-${format(new Date(), "yyyy-MM-dd")}.jpg`;
}
