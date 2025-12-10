/// <reference types="vitest" />
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", async () => {
  const mod = await import("./mocks/prisma");
  const prisma = mod.PrismaClient.instance ?? new mod.PrismaClient();
  return { prisma };
});

import { shortenUrl, deleteShortUrl } from "@/lib/url-shortener";
import { getPrismaMock } from "./mocks/prisma";

describe("url-shortener", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    getPrismaMock().reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when API key or domain missing", async () => {
    const result = await shortenUrl("https://example.com");
    expect(result).toBeNull();
  });

  it("creates short URL when settings and API succeed", async () => {
    const prisma = getPrismaMock();
    prisma.seedSetting("shortio_api_key", "key123");
    prisma.seedSetting("shortio_domain", "sho.rt");

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "lnk_1", shortURL: "https://sho.rt/abc" }),
    });

    const result = await shortenUrl("https://example.com");
    expect(result).toEqual({ shortURL: "https://sho.rt/abc", linkId: "lnk_1" });
  });

  it("deletes short URLs and treats 404 as success", async () => {
    const prisma = getPrismaMock();
    prisma.seedSetting("shortio_api_key", "key123");

    (fetch as any).mockResolvedValueOnce({ ok: false, status: 404, text: async () => "not found" });
    const ok = await deleteShortUrl("lnk_404");
    expect(ok).toBe(true);
  });

  it("archives when delete returns 500", async () => {
    const prisma = getPrismaMock();
    prisma.seedSetting("shortio_api_key", "key123");

    (fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "fail" })
      .mockResolvedValueOnce({ ok: true });

    const ok = await deleteShortUrl("lnk_500");
    expect(ok).toBe(true);
    expect((fetch as any)).toHaveBeenCalledTimes(2);
  });
});
