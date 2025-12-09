"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, X, Clock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFilenameFromResponse } from "@/lib/certificate-utils";

export type CertificateButtonState =
  | "checking"
  | "ready"
  | "downloading"
  | "success"
  | "error"
  | "generating";

interface CertificateDownloadButtonProps {
  gameCode: string;
  playerId?: string; // Required for player certificates
  playerName?: string; // For display text
  type: "host" | "player";
  disabled?: boolean;
  size?: "default" | "sm" | "lg"; // Button size
  className?: string;
  onStateChange?: (state: CertificateButtonState) => void;
}

export function CertificateDownloadButton({
  gameCode,
  playerId,
  playerName,
  type,
  disabled,
  size = "lg", // Default to lg for backwards compatibility
  className,
  onStateChange,
}: CertificateDownloadButtonProps) {
  const [state, setState] = useState<CertificateButtonState>("checking");
  const [certificateStatus, setCertificateStatus] = useState<string | null>(
    null
  );

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/status`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to check certificate status (${response.status})`
        );
      }

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
        } else if (cert.status === "pending" || cert.status === "generating") {
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
  }, [gameCode, type, playerId]);

  // Check certificate status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Notify parent about state changes (used for conditional UI)
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Poll while generating or if we previously errored
  useEffect(() => {
    const shouldPoll =
      state === "checking" ||
      state === "error" ||
      certificateStatus === "pending" ||
      certificateStatus === "generating";

    if (!shouldPoll) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkStatus, certificateStatus, state]);

  const handleDownload = async () => {
    if (state === "error") {
      // Retry fetching status when previously errored
      setState("checking");
      await checkStatus();
      return;
    }

    if (state !== "ready") return;

    setState("downloading");

    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ type, playerId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If certificate is still generating, update state instead of showing error
        if (
          errorData.status === "pending" ||
          errorData.status === "generating"
        ) {
          setCertificateStatus(errorData.status);
          setState("generating");
          return;
        }

        if (errorData.status === "failed") {
          setCertificateStatus(errorData.status);
          setState("error");
        }

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
        : "Download Certificate",
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
      className={className}
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
