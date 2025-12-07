"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, X, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFilenameFromResponse } from "@/lib/certificate-utils";

interface CertificateDownloadButtonProps {
  gameCode: string;
  playerId?: string; // Required for player certificates
  playerName?: string; // For display text
  type: "host" | "player";
  disabled?: boolean;
  size?: "default" | "sm" | "lg"; // Button size
}

export function CertificateDownloadButton({
  gameCode,
  playerId,
  playerName,
  type,
  disabled,
  size = "lg", // Default to lg for backwards compatibility
}: CertificateDownloadButtonProps) {
  const [state, setState] = useState<
    "checking" | "ready" | "downloading" | "success" | "error" | "generating"
  >("checking");
  const [certificateStatus, setCertificateStatus] = useState<string | null>(
    null
  );

  // Check certificate status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/games/${gameCode}/certificates/status`
        );
        const data = await response.json();

        // Find this certificate
        const cert = data.certificates.find(
          (c: any) =>
            c.type === type && (type === "host" || c.playerId === playerId)
        );

        if (cert) {
          setCertificateStatus(cert.status);
          if (cert.status === "completed") {
            setState("ready");
          } else if (
            cert.status === "pending" ||
            cert.status === "generating"
          ) {
            setState("generating");
          } else if (cert.status === "failed") {
            setState("error");
          }
        } else {
          // No certificate record yet, might be old game
          setState("checking");
        }
      } catch (error) {
        console.error("Failed to check certificate status:", error);
        setState("error");
      }
    };

    checkStatus();

    // Poll while generating
    const interval = setInterval(() => {
      if (
        certificateStatus === "pending" ||
        certificateStatus === "generating"
      ) {
        checkStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameCode, type, playerId, certificateStatus]);

  const handleDownload = async () => {
    if (state !== "ready") return;

    setState("downloading");

    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/download`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, playerId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download certificate");
      }

      // Download blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        getFilenameFromResponse(response) ||
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ||
        "certificate.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState("success");
      toast.success("Certificate downloaded!");
      setTimeout(() => setState("ready"), 2000);
    } catch (error) {
      console.error("Certificate download error:", error);
      setState("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download certificate"
      );
      setTimeout(() => setState("ready"), 2000);
    }
  };

  const buttonText = {
    checking: "Checking...",
    ready:
      type === "host"
        ? "Download Leaderboard Certificate"
        : "Download My Certificate",
    downloading: "Downloading...",
    success: "Downloaded!",
    error: "Error - Try Again",
    generating: "Generating...",
  };

  const isDisabled =
    disabled ||
    state === "checking" ||
    state === "downloading" ||
    state === "generating";

  return (
    <Button
      onClick={handleDownload}
      disabled={isDisabled}
      variant={state === "success" ? "default" : "outline"}
      size={size}
    >
      {state === "checking" && (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      )}
      {state === "generating" && <Clock className="mr-2 h-5 w-5" />}
      {state === "downloading" && (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      )}
      {state === "success" && <Check className="mr-2 h-5 w-5" />}
      {state === "error" && <X className="mr-2 h-5 w-5" />}
      {state === "ready" && <Download className="mr-2 h-5 w-5" />}
      {buttonText[state]}
    </Button>
  );
}
