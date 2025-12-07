"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getFilenameFromResponse } from "@/lib/certificate-utils";

interface CertificateDownloadButtonProps {
  gameCode: string;
  playerId?: string; // Required for player certificates
  playerName?: string; // For display text
  type: "host" | "player";
  disabled?: boolean;
}

export function CertificateDownloadButton({
  gameCode,
  playerId,
  playerName,
  type,
  disabled,
}: CertificateDownloadButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const handleDownload = async () => {
    setState("loading");

    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, playerId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate certificate");
      }

      // Download blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFilenameFromResponse(response);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState("success");
      toast.success("Certificate downloaded!");
      setTimeout(() => setState("idle"), 2000);
    } catch (error) {
      console.error("Certificate download error:", error);
      setState("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download certificate"
      );
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const buttonText = {
    idle: type === "host" ? "Download Leaderboard Certificate" : "Download My Certificate",
    loading: "Generating Certificate...",
    success: "Downloaded!",
    error: "Error - Try Again",
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || state === "loading"}
      variant={state === "success" ? "default" : "outline"}
      size="lg"
    >
      {state === "loading" && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      {state === "success" && <Check className="mr-2 h-5 w-5" />}
      {state === "error" && <X className="mr-2 h-5 w-5" />}
      {state === "idle" && <Download className="mr-2 h-5 w-5" />}
      {buttonText[state]}
    </Button>
  );
}
