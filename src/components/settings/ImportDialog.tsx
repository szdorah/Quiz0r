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
import {
  Loader2,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
import {
  validateExportFile,
  generateImportPreview,
  importSettingsFromFile,
} from "@/lib/settings-export";
import { isCryptoAvailable } from "@/lib/crypto-utils";
import { ImportPreview } from "@/types/settings-export";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: Record<string, string>;
  onImportSuccess: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  currentSettings,
  onImportSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cryptoAvailable, setCryptoAvailable] = useState(true);

  useEffect(() => {
    if (open) {
      setCryptoAvailable(isCryptoAvailable());
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setPassword("");
    }
  };

  const handleDecryptPreview = async () => {
    if (!file || !password) return;

    setLoading(true);
    try {
      const fileContent = await file.text();
      const exportFile = validateExportFile(fileContent);
      const importPreview = await generateImportPreview(
        exportFile,
        password,
        currentSettings
      );
      setPreview(importPreview);
    } catch (error) {
      console.error("Decrypt error:", error);
      toast.error("Decryption failed", {
        description:
          error instanceof Error
            ? error.message
            : "Invalid password or corrupted file",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !password || !preview) return;

    setImporting(true);
    try {
      const fileContent = await file.text();
      const exportFile = validateExportFile(fileContent);
      const newSettings = await importSettingsFromFile(exportFile, password);

      // Map snake_case settings from the export into the camelCase API payload
      const payload: Record<string, string> = {};
      if (newSettings.ngrok_token !== undefined) {
        payload.ngrokToken = newSettings.ngrok_token;
      }
      if (newSettings.shortio_api_key !== undefined) {
        payload.shortioApiKey = newSettings.shortio_api_key;
      }
      if (newSettings.shortio_domain !== undefined) {
        payload.shortioDomain = newSettings.shortio_domain;
      }
      if (newSettings.openai_api_key !== undefined) {
        payload.openaiApiKey = newSettings.openai_api_key;
      }

      // Save settings to database via API
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings to database");
      }

      toast.success("Settings imported successfully!", {
        description: `${Object.keys(newSettings).length} settings have been updated`,
      });

      // Reset and close
      setFile(null);
      setPassword("");
      setPreview(null);
      onOpenChange(false);
      onImportSuccess();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Settings</DialogTitle>
          <DialogDescription>
            Select an encrypted export file and enter the password to restore
            your settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Crypto Not Available Warning */}
          {!cryptoAvailable && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-100">
                <p className="font-semibold mb-1">Decryption Not Available</p>
                <p className="text-red-800 dark:text-red-200">
                  The Web Crypto API is not available. Please ensure you are
                  accessing this page over HTTPS or on localhost. Import is
                  disabled until this is resolved.
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          {!preview && (
            <div className="space-y-2">
              <Label htmlFor="file">Export File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {file && <FileJson className="h-5 w-5 text-muted-foreground" />}
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Password */}
          {file && !preview && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter decryption password"
                  autoComplete="current-password"
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
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Preview Import</h4>
                  <p className="text-sm text-muted-foreground">
                    Exported: {new Date(preview.timestamp).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreview(null);
                    setPassword("");
                  }}
                >
                  Change File
                </Button>
              </div>

              <div className="border rounded-lg">
                <div className="max-h-[200px] overflow-y-auto">
                  {preview.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-3 border-b last:border-b-0"
                    >
                      <code className="text-sm">{setting.key}</code>
                      <span
                        className={
                          setting.action === "overwrite"
                            ? "text-sm text-amber-600 dark:text-amber-400"
                            : "text-sm text-green-600 dark:text-green-400"
                        }
                      >
                        {setting.action === "overwrite"
                          ? "⚠️ Will overwrite"
                          : "✅ Will add"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              {preview.settings.some((s) => s.action === "overwrite") && (
                <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <span className="font-semibold">Warning:</span> This will
                    overwrite{" "}
                    {preview.settings.filter((s) => s.action === "overwrite").length}{" "}
                    existing settings. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setPassword("");
              setPreview(null);
              onOpenChange(false);
            }}
            disabled={loading || importing}
          >
            Cancel
          </Button>

          {!preview ? (
            <Button
              onClick={handleDecryptPreview}
              disabled={!file || !password || loading || !cryptoAvailable}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Decrypting...
                </>
              ) : (
                "Decrypt & Preview"
              )}
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing || !cryptoAvailable}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Settings
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
