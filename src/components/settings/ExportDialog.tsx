"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { calculatePasswordStrength } from "@/lib/password-strength";
import {
  exportSettingsToFile,
  generateExportFilename,
  downloadFile,
} from "@/lib/settings-export";
import { isCryptoAvailable } from "@/lib/crypto-utils";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Record<string, string>;
  onExportSuccess?: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  settings,
  onExportSuccess,
}: ExportDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cryptoAvailable, setCryptoAvailable] = useState(true);

  useEffect(() => {
    if (open) {
      setCryptoAvailable(isCryptoAvailable());
    }
  }, [open]);

  const strength = calculatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canExport = strength.isValid && passwordsMatch && cryptoAvailable;

  const handleExport = async () => {
    if (!canExport) return;

    setExporting(true);
    try {
      const exportFile = await exportSettingsToFile(settings, password);
      downloadFile(exportFile, generateExportFilename());

      toast.success("Settings exported successfully!", {
        description: `${exportFile.metadata.settingsCount} settings encrypted and downloaded`,
      });

      onExportSuccess?.();

      // Reset and close
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Settings</DialogTitle>
          <DialogDescription>
            Your settings will be encrypted with a password. You&apos;ll need
            this password to import the settings later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Crypto Not Available Warning */}
          {!cryptoAvailable && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-100">
                <p className="font-semibold mb-1">Encryption Not Available</p>
                <p className="text-red-800 dark:text-red-200">
                  The Web Crypto API is not available. Please ensure you are
                  accessing this page over HTTPS or on localhost. Export is
                  disabled until this is resolved.
                </p>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter encryption password"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {password && <PasswordStrengthIndicator strength={strength} />}
          </div>

          {/* Confirm Password */}
          {password && strength.isValid && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-semibold mb-1">
                Important: Store your password securely
              </p>
              <p className="text-amber-800 dark:text-amber-200">
                If you lose your password, you cannot decrypt the export file.
                There is no password recovery.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canExport || exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
