/// <reference types="vitest" />
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", async () => {
  const mod = await import("./mocks/prisma");
  const prisma = mod.PrismaClient.instance ?? new mod.PrismaClient();
  return { prisma };
});

vi.mock("@ngrok/ngrok", () => ({
  default: {
    forward: vi.fn(),
    disconnect: vi.fn(),
  },
}));

import { autoStartTunnel, getTunnelUrl, isTunnelRunning, startTunnel, stopTunnel } from "@/lib/tunnel";
import ngrok from "@ngrok/ngrok";
import { getPrismaMock } from "./mocks/prisma";

describe("tunnel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getPrismaMock().reset();
    (ngrok as any).forward.mockResolvedValue({
      url: () => "https://abc.ngrok.io",
      close: vi.fn(),
    });
  });

  it("does nothing when no token present", async () => {
    await autoStartTunnel();
    expect((ngrok as any).forward).not.toHaveBeenCalled();
    expect(getTunnelUrl()).toBeNull();
  });

  it("starts and stops tunnel, storing URL", async () => {
    const prisma = getPrismaMock();
    prisma.seedSetting("ngrok_token", "token-123");

    const url = await startTunnel("token-123");
    expect(url).toBe("https://abc.ngrok.io");
    expect(isTunnelRunning()).toBe(true);

    await stopTunnel();
    expect(isTunnelRunning()).toBe(false);
  });
});
