"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { getFilenameFromResponse } from "@/lib/certificate-utils";

interface CertificateRegenerationPanelProps {
  gameCode: string;
}

interface CertificateInfo {
  id: string;
  type: "host" | "player";
  playerId?: string;
  playerName?: string;
  status: string;
  errorMessage?: string;
  retryCount: number;
}

export function CertificateRegenerationPanel({
  gameCode,
}: CertificateRegenerationPanelProps) {
  const [certificates, setCertificates] = useState<CertificateInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(
    new Set()
  );

  const fetchCertificates = async () => {
    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/status`
      );
      const data = await response.json();
      setCertificates(
        data.certificates.map((cert: any) => ({
          id: cert.id,
          type: cert.type,
          playerId: cert.playerId,
          playerName: cert.playerName,
          status: cert.status,
          errorMessage: cert.errorMessage,
          retryCount: cert.retryCount,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };

  const handleDownload = async (cert: CertificateInfo) => {
    if (cert.status !== "completed") {
      toast.error("Certificate is not ready to download yet");
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(cert.id));

    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            type: cert.type,
            playerId: cert.playerId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to download certificate (${response.status})`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFilenameFromResponse(response);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        cert.type === "host"
          ? "Host certificate downloaded"
          : `${cert.playerName || "Player"}'s certificate downloaded`
      );
    } catch (error) {
      console.error("Certificate download error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download certificate"
      );
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(cert.id);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchCertificates();
    const interval = setInterval(fetchCertificates, 3000);
    return () => clearInterval(interval);
  }, [gameCode]);

  const handleRegenerate = async (certIds: string[]) => {
    if (certIds.length === 0) {
      toast.error("Please select at least one certificate");
      return;
    }

    setRegenerating(true);

    try {
      const response = await fetch(
        `/api/games/${gameCode}/certificates/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateIds: certIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate certificates");
      }

      toast.success(`Regeneration started for ${certIds.length} certificate(s)`);
      setSelectedIds(new Set()); // Clear selection
      fetchCertificates();
    } catch (error) {
      console.error("Regeneration error:", error);
      toast.error("Failed to regenerate certificates");
    } finally {
      setTimeout(() => setRegenerating(false), 2000);
    }
  };

  const toggleSelection = (certId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(certId)) {
        next.delete(certId);
      } else {
        next.add(certId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === certificates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(certificates.map((c) => c.id)));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (cert: CertificateInfo) => {
    const label =
      cert.type === "host"
        ? "Host Certificate"
        : `${cert.playerName || "Player"}`;

    if (cert.status === "failed" && cert.retryCount > 0) {
      return `${label} [Retry: ${cert.retryCount}/1]`;
    }

    return label;
  };

  if (certificates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Certificate Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedIds.size === certificates.length}
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({certificates.length})
            </label>
          </div>

          {/* Certificate List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    id={cert.id}
                    checked={selectedIds.has(cert.id)}
                    onCheckedChange={() => toggleSelection(cert.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(cert.status)}
                      <label
                        htmlFor={cert.id}
                        className="text-sm font-medium cursor-pointer truncate"
                      >
                        {getStatusText(cert)}
                      </label>
                    </div>
                    {cert.errorMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {cert.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(cert)}
                  size="sm"
                  variant="outline"
                  disabled={
                    cert.status !== "completed" ||
                    downloadingIds.has(cert.id)
                  }
                  className="flex-shrink-0"
                >
                  {downloadingIds.has(cert.id) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              onClick={() =>
                handleRegenerate(Array.from(selectedIds))
              }
              disabled={selectedIds.size === 0 || regenerating}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {regenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate Selected ({selectedIds.size})
            </Button>
            <Button
              onClick={() =>
                handleRegenerate(certificates.map((c) => c.id))
              }
              disabled={regenerating}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {regenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
