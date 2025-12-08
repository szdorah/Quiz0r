"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemePreviewMini } from "@/components/admin/ThemePreview";
import { DEFAULT_THEME } from "@/types/theme";
import { THEME_PRESETS, PRESET_LIST } from "@/lib/theme-presets";
import { parseTheme } from "@/lib/theme";
import { Loader2, Palette, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeRecord {
  id: string;
  name: string;
  description: string | null;
  theme: string;
}

export default function ThemeLibraryPage() {
  const [customThemes, setCustomThemes] = useState<ThemeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    setLoading(true);
    try {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        setCustomThemes(data.themes || []);
      }
    } catch (err) {
      console.error("Failed to load themes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTheme(themeId: string) {
    if (!confirm("Delete this theme? This cannot be undone.")) return;

    setDeletingId(themeId);
    try {
      const res = await fetch(`/api/themes/${themeId}`, { method: "DELETE" });
      if (res.ok) {
        setCustomThemes((prev) => prev.filter((t) => t.id !== themeId));
      }
    } catch (err) {
      console.error("Failed to delete theme:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const builtInThemes = [
    { id: "default", name: "Default", description: "App base styling", theme: DEFAULT_THEME },
    ...PRESET_LIST.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      theme: THEME_PRESETS[preset.id],
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Theme Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Preview, create, and edit themes. Apply them inside each quiz.
          </p>
        </div>
        <Link href="/admin/themes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Theme
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Built-in Themes</CardTitle>
            <CardDescription>Ready-made themes you can apply to any quiz</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {builtInThemes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-lg border p-3 flex flex-col gap-2 bg-muted/40"
              >
                <ThemePreviewMini theme={theme.theme} />
                <div>
                  <p className="font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Built-in
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Themes</CardTitle>
            <CardDescription>
              Themes created with the AI wizard or manual JSON editing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading themes...
              </div>
            ) : customThemes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                No custom themes yet. Click &quot;Create Theme&quot; to get started.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {customThemes.map((theme) => {
                  const parsed = parseTheme(theme.theme);
                  const preview = parsed || DEFAULT_THEME;
                  return (
                    <div
                      key={theme.id}
                      className={cn(
                        "rounded-lg border p-3 flex flex-col gap-2",
                        deletingId === theme.id && "opacity-60 pointer-events-none"
                      )}
                    >
                      <ThemePreviewMini theme={preview} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{theme.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {theme.description || "Custom theme"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/admin/themes/${theme.id}`}>
                            <Button variant="outline" size="icon">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTheme(theme.id)}
                            disabled={!!deletingId}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
