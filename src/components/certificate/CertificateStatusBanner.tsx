"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CertificateStatusBannerProps {
  gameCode: string;
  onStatusChange?: (allReady: boolean) => void;
}

export function CertificateStatusBanner({
  gameCode,
  onStatusChange,
}: CertificateStatusBannerProps) {
  const [status, setStatus] = useState<{
    total: number;
    completed: number;
    failed: number;
    percentage: number;
    estimatedSecondsRemaining: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/games/${gameCode}/certificates/status`
        );
        const data = await response.json();

        const pending = data.pending || 0;
        const generating = data.generating || 0;
        const completed = data.completed || 0;
        const failed = data.failed || 0;
        const total = data.total || 0;

        const percentage =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        setStatus({
          total,
          completed,
          failed,
          percentage,
          estimatedSecondsRemaining: 0, // Will be updated by socket
        });

        const allReady = completed === total && failed === 0;
        onStatusChange?.(allReady);

        // Stop polling when all done
        if (allReady || completed + failed === total) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to check certificate status:", error);
        setIsLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds while loading
    const interval = setInterval(() => {
      if (isLoading) {
        checkStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameCode, onStatusChange, isLoading]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return "Less than 1 minute";
    }
    const minutes = Math.ceil(seconds / 60);
    return `About ${minutes} minute${minutes > 1 ? "s" : ""}`;
  };

  if (!status || status.completed === status.total) {
    return null; // Hide when complete
  }

  const allFailed = status.failed === status.total && status.total > 0;
  const someCompleted = status.completed > 0;

  return (
    <Alert variant={allFailed ? "destructive" : "default"}>
      <div className="flex items-center gap-3">
        {!allFailed && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />}
        {allFailed && <XCircle className="h-5 w-5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <AlertDescription>
            {allFailed
              ? "Certificate generation failed. Please try regenerating."
              : someCompleted
              ? `Generating certificates... ${status.completed} of ${status.total} complete${
                  status.estimatedSecondsRemaining > 0
                    ? ` (Est. ${formatTimeRemaining(
                        status.estimatedSecondsRemaining
                      )} remaining)`
                    : ""
                }`
              : "Starting certificate generation..."}
          </AlertDescription>
          {!allFailed && (
            <Progress value={status.percentage} className="mt-2" />
          )}
        </div>
      </div>
    </Alert>
  );
}
