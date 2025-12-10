/// <reference types="vitest" />
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("openai", () => ({ default: vi.fn() }));
vi.mock("@/lib/db", async () => {
  const mod = await import("./mocks/prisma");
  const prisma = mod.PrismaClient.instance ?? new mod.PrismaClient();
  return { prisma };
});

import OpenAI from "openai";
import { generateCongratulatoryMessage, getFallbackMessage } from "@/lib/openai-congratulations";
import { getPrismaMock } from "./mocks/prisma";

describe("openai-congratulations", () => {
  beforeEach(() => {
    getPrismaMock().reset();
    vi.restoreAllMocks();
  });

  it("returns fallback when OpenAI is not configured", async () => {
    const msg = await generateCongratulatoryMessage("Pat", 1, 5, 1000, "Quiz");
    expect(msg).toContain("Pat");
  });

  it("uses OpenAI client when configured", async () => {
    const prisma = getPrismaMock();
    prisma.seedSetting("openai_api_key", "test-key");
    const fakeMessage = "Great job!";

    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: fakeMessage } }],
    });
    const chat = { completions: { create } };

    vi.mocked(OpenAI).mockReturnValue({ chat } as any);

    const msg = await generateCongratulatoryMessage("Pat", 2, 10, 900, "Quiz");
    expect(msg).toBe(fakeMessage);
    expect(create).toHaveBeenCalled();
  });

  it("provides ordinalized fallback messages", () => {
    expect(getFallbackMessage("Pat", 1, 10)).toContain("1st");
    expect(getFallbackMessage("Pat", 3, 10)).toContain("3rd");
  });
});
