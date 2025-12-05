import ngrok from "@ngrok/ngrok";
import { prisma } from "./db";

let tunnelUrl: string | null = null;
let listener: ngrok.Listener | null = null;

// Auto-start tunnel on server boot if token exists
export async function autoStartTunnel(): Promise<void> {
  try {
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: "ngrok_token" },
    });

    if (tokenSetting?.value) {
      console.log("Found ngrok token, auto-starting tunnel...");
      await startTunnel(tokenSetting.value);
    }
  } catch (error) {
    console.error("Failed to auto-start tunnel:", error);
  }
}

export async function startTunnel(authToken: string): Promise<string> {
  // Stop existing tunnel if any
  await stopTunnel();

  try {
    // Start ngrok tunnel
    listener = await ngrok.forward({
      addr: 3000,
      authtoken: authToken,
    });

    tunnelUrl = listener.url() || null;
    console.log(`Tunnel started: ${tunnelUrl}`);

    // Save URL to database so API routes can access it
    if (tunnelUrl) {
      await prisma.setting.upsert({
        where: { key: "tunnel_url" },
        update: { value: tunnelUrl },
        create: { key: "tunnel_url", value: tunnelUrl },
      });
    }

    return tunnelUrl || "";
  } catch (error) {
    console.error("Failed to start tunnel:", error);
    throw error;
  }
}

export async function stopTunnel(): Promise<void> {
  // Close the listener if it exists in this process
  if (listener) {
    try {
      await listener.close();
      console.log("Tunnel stopped");
    } catch (error) {
      console.error("Error stopping tunnel:", error);
    }
    listener = null;
    tunnelUrl = null;
  }

  // Always clear URL from database (even if listener wasn't in this process)
  try {
    await prisma.setting.deleteMany({
      where: { key: "tunnel_url" },
    });
    console.log("Tunnel URL cleared from database");
  } catch (error) {
    console.error("Error clearing tunnel URL from database:", error);
  }

  // Also try to disconnect any ngrok sessions
  try {
    await ngrok.disconnect();
  } catch {
    // Ignore - may not have any active sessions
  }
}

export function getTunnelUrl(): string | null {
  return tunnelUrl;
}

export function isTunnelRunning(): boolean {
  return listener !== null && tunnelUrl !== null;
}
