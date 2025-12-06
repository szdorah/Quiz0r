"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Settings,
  Globe,
  Key,
  Play,
  Square,
  Loader2,
  Check,
  ExternalLink,
  Copy,
  Link2,
} from "lucide-react";

interface SettingsData {
  ngrokToken: string | null;
  hasToken: boolean;
  tunnelRunning: boolean;
  tunnelUrl: string | null;
  shortioApiKey: string | null;
  hasShortioApiKey: boolean;
  shortioDomain: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortioApiKeyInput, setShortioApiKeyInput] = useState("");
  const [shortioDomainInput, setShortioDomainInput] = useState("");
  const [showShortio, setShowShortio] = useState(false);
  const [savingShortio, setSavingShortio] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveToken() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngrokToken: tokenInput }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Token saved successfully!" });
        setTokenInput("");
        setShowToken(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save token" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save token" });
    } finally {
      setSaving(false);
    }
  }

  async function removeToken() {
    if (!confirm("Are you sure you want to remove your ngrok token?")) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngrokToken: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Token removed" });
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove token" });
    } finally {
      setSaving(false);
    }
  }

  async function startTunnel() {
    setTunnelLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/tunnel", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Tunnel started!" });
        fetchSettings();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to start tunnel" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to start tunnel" });
    } finally {
      setTunnelLoading(false);
    }
  }

  async function stopTunnel() {
    setTunnelLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/tunnel", {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Tunnel stopped" });
        // Clear cached URL from localStorage
        localStorage.removeItem("quiz-master-base-url");
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to stop tunnel" });
    } finally {
      setTunnelLoading(false);
    }
  }

  function copyUrl() {
    if (settings?.tunnelUrl) {
      navigator.clipboard.writeText(settings.tunnelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function saveShortioSettings() {
    setSavingShortio(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortioApiKey: shortioApiKeyInput,
          shortioDomain: shortioDomainInput,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Short.io settings saved successfully!" });
        setShortioApiKeyInput("");
        setShortioDomainInput("");
        setShowShortio(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save Short.io settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save Short.io settings" });
    } finally {
      setSavingShortio(false);
    }
  }

  async function confirmRemoveShortioSettings() {
    setSavingShortio(true);
    setMessage(null);
    setShowRemoveDialog(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortioApiKey: "", shortioDomain: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Short.io settings removed" });
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove Short.io settings" });
    } finally {
      setSavingShortio(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tunnel Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            External Tunnel
          </CardTitle>
          <CardDescription>
            Enable external access so mobile players can join your quizzes by scanning QR codes.
            Get a free ngrok auth token at{" "}
            <a
              href="https://dashboard.ngrok.com/get-started/your-authtoken"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ngrok.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>ngrok Auth Token</Label>
            </div>

            {settings?.hasToken ? (
              <div className="flex items-center gap-4">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {settings.ngrokToken}
                </code>
                <Button variant="outline" size="sm" onClick={removeToken} disabled={saving}>
                  Remove
                </Button>
              </div>
            ) : showToken ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Paste your ngrok auth token..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveToken} disabled={!tokenInput || saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowToken(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowToken(true)}>
                <Key className="w-4 h-4 mr-2" />
                Add Token
              </Button>
            )}
          </div>

          {/* Tunnel Status */}
          {settings?.hasToken && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tunnel Status:</span>
                  {settings.tunnelRunning ? (
                    <Badge className="bg-green-500">Running</Badge>
                  ) : (
                    <Badge variant="secondary">Stopped</Badge>
                  )}
                </div>

                {settings.tunnelRunning ? (
                  <Button
                    variant="outline"
                    onClick={stopTunnel}
                    disabled={tunnelLoading}
                  >
                    {tunnelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    Stop Tunnel
                  </Button>
                ) : (
                  <Button onClick={startTunnel} disabled={tunnelLoading}>
                    {tunnelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Tunnel
                  </Button>
                )}
              </div>

              {settings.tunnelUrl && (
                <div className="space-y-2">
                  <Label>Public URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm break-all">
                      {settings.tunnelUrl}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyUrl}>
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <a
                      href={settings.tunnelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This URL will be used for QR codes when you host a game.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Short.io Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Short.io URL Shortener
          </CardTitle>
          <CardDescription>
            Generate short URLs for join links to make them easier to share.
            Get a free API key and find your domain at{" "}
            <a
              href="https://app.short.io/settings/integrations/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              short.io
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>Short.io API Key</Label>
            </div>

            {settings?.hasShortioApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                    {settings.shortioApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveDialog(true)}
                    disabled={savingShortio}
                  >
                    Remove
                  </Button>
                </div>
                {settings.shortioDomain && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Domain</Label>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm">
                      {settings.shortioDomain}
                    </code>
                  </div>
                )}
              </div>
            ) : showShortio ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Paste your Short.io API key..."
                    value={shortioApiKeyInput}
                    onChange={(e) => setShortioApiKeyInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Domain (required)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., link.yourdomain.com"
                    value={shortioDomainInput}
                    onChange={(e) => setShortioDomainInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Short.io domain (find it in your Short.io dashboard)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveShortioSettings}
                    disabled={!shortioApiKeyInput || !shortioDomainInput || savingShortio}
                  >
                    {savingShortio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowShortio(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowShortio(true)}>
                <Key className="w-4 h-4 mr-2" />
                Add Short.io Settings
              </Button>
            )}
          </div>

          {settings?.hasShortioApiKey && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Short URLs will automatically be generated for join links when available.
                If URL shortening fails, the full URL will be used as a fallback.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Short.io Settings?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your Short.io API key and domain?
              Your join links will no longer be shortened.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={savingShortio}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveShortioSettings}
              disabled={savingShortio}
            >
              {savingShortio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
