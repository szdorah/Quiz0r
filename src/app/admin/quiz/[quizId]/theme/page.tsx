"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemePreview, ThemePreviewMini } from "@/components/admin/ThemePreview";
import { QuizTheme, DEFAULT_THEME } from "@/types/theme";
import { parseTheme, validateThemeJson, stringifyTheme } from "@/lib/theme";
import { THEME_PRESETS, PRESET_LIST } from "@/lib/theme-presets";
import { generateAIPrompt, ThemeWizardAnswers } from "@/lib/theme-template";
import {
  ArrowLeft,
  Palette,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Trash2,
  Wand2,
} from "lucide-react";

interface Props {
  params: Promise<{ quizId: string }>;
}

type TabType = "presets" | "wizard" | "json";

export default function ThemeEditorPage({ params }: Props) {
  const [quizId, setQuizId] = useState("");
  const router = useRouter();

  // Unwrap params (Next.js 15)
  useEffect(() => {
    params.then((p) => setQuizId(p.quizId));
  }, [params]);

  const [quizTitle, setQuizTitle] = useState("");
  const [currentTheme, setCurrentTheme] = useState<QuizTheme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [previewTheme, setPreviewTheme] = useState<QuizTheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("presets");

  // Wizard form state
  const [wizardAnswers, setWizardAnswers] = useState<ThemeWizardAnswers>({
    topic: "",
    mood: "",
    colors: "",
    backgroundAnimation: "",
    celebration: "",
  });

  // Load current theme
  useEffect(() => {
    if (!quizId) return; // Wait for quizId to be set

    async function loadTheme() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/theme`);
        if (res.ok) {
          const data = await res.json();
          setQuizTitle(data.title);
          if (data.theme) {
            const parsed = parseTheme(data.theme);
            setCurrentTheme(parsed);
            setPreviewTheme(parsed);
            setThemeJson(data.theme);
          }
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, [quizId]);

  // Handle JSON input change
  const handleJsonChange = (value: string) => {
    setThemeJson(value);
    setError(null);

    if (!value.trim()) {
      setPreviewTheme(null);
      return;
    }

    const validationError = validateThemeJson(value);
    if (validationError) {
      setError(validationError);
      setPreviewTheme(currentTheme);
    } else {
      const parsed = parseTheme(value);
      setPreviewTheme(parsed);
    }
  };

  // Select preset
  const selectPreset = (presetId: string) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      const json = stringifyTheme(preset);
      setThemeJson(json);
      setPreviewTheme(preset);
      setError(null);
    }
  };

  // Copy AI prompt to clipboard
  const copyAIPrompt = async () => {
    const prompt = generateAIPrompt(wizardAnswers);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save theme
  const saveTheme = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeJson || null }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = parseTheme(data.theme);
        setCurrentTheme(parsed);
        router.push(`/admin/quiz/${quizId}/questions`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save theme");
      }
    } catch (err) {
      console.error("Failed to save theme:", err);
      setError("Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  // Clear theme
  const clearTheme = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/theme`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCurrentTheme(null);
        setPreviewTheme(null);
        setThemeJson("");
        setError(null);
      }
    } catch (err) {
      console.error("Failed to clear theme:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/quiz/${quizId}/questions`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme Editor
              </h1>
              <p className="text-sm text-muted-foreground">{quizTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {currentTheme && (
              <Button variant="outline" onClick={clearTheme} disabled={saving}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Theme
              </Button>
            )}
            <Button onClick={saveTheme} disabled={saving || !!error}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Theme
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Theme Configuration */}
          <div className="space-y-6">
            {/* Tab Buttons */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === "presets" ? "default" : "outline"}
                onClick={() => setActiveTab("presets")}
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Presets
              </Button>
              <Button
                variant={activeTab === "wizard" ? "default" : "outline"}
                onClick={() => setActiveTab("wizard")}
                size="sm"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Wizard
              </Button>
              <Button
                variant={activeTab === "json" ? "default" : "outline"}
                onClick={() => setActiveTab("json")}
                size="sm"
              >
                JSON
              </Button>
            </div>

            {/* Presets Tab */}
            {activeTab === "presets" && (
              <Card>
                <CardHeader>
                  <CardTitle>Theme Presets</CardTitle>
                  <CardDescription>
                    Choose a pre-made theme to get started quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Default Theme */}
                    <button
                      onClick={() => {
                        setThemeJson(stringifyTheme(DEFAULT_THEME));
                        setPreviewTheme(DEFAULT_THEME);
                        setError(null);
                      }}
                      className="text-left p-3 rounded-lg border hover:border-primary transition-colors"
                    >
                      <ThemePreviewMini theme={DEFAULT_THEME} />
                      <p className="font-medium mt-2">Default</p>
                      <p className="text-xs text-muted-foreground">
                        Purple theme (current)
                      </p>
                    </button>

                    {/* Other Presets */}
                    {PRESET_LIST.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset.id)}
                        className="text-left p-3 rounded-lg border hover:border-primary transition-colors"
                      >
                        <ThemePreviewMini theme={THEME_PRESETS[preset.id]} />
                        <p className="font-medium mt-2">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Wizard Tab */}
            {activeTab === "wizard" && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Theme Wizard</CardTitle>
                  <CardDescription>
                    Answer a few questions, then copy the prompt to ChatGPT or Claude
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">What is your quiz about?</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Christmas Trivia, Science Quiz, Movie Night"
                      value={wizardAnswers.topic}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, topic: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mood">What mood do you want?</Label>
                    <Input
                      id="mood"
                      placeholder="e.g., fun and playful, professional, spooky, festive"
                      value={wizardAnswers.mood}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, mood: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colors">Preferred colors (optional)</Label>
                    <Input
                      id="colors"
                      placeholder="e.g., blues and greens, warm sunset colors, neon"
                      value={wizardAnswers.colors}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, colors: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background">Background animation</Label>
                    <Input
                      id="background"
                      placeholder="e.g., falling snow, twinkling stars, bubbles, none"
                      value={wizardAnswers.backgroundAnimation}
                      onChange={(e) =>
                        setWizardAnswers({
                          ...wizardAnswers,
                          backgroundAnimation: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celebration">Celebration effect</Label>
                    <Input
                      id="celebration"
                      placeholder="e.g., confetti, sparkles, fireworks, simple glow"
                      value={wizardAnswers.celebration}
                      onChange={(e) =>
                        setWizardAnswers({
                          ...wizardAnswers,
                          celebration: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button
                    onClick={copyAIPrompt}
                    disabled={!wizardAnswers.topic || !wizardAnswers.mood}
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt for AI
                      </>
                    )}
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t">
                    <p className="font-medium">Next steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Click &quot;Copy Prompt for AI&quot; above</li>
                      <li>Paste into ChatGPT, Claude, or your preferred AI</li>
                      <li>Copy the JSON response from the AI</li>
                      <li>Go to the JSON tab and paste it there</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* JSON Tab */}
            {activeTab === "json" && (
              <Card>
                <CardHeader>
                  <CardTitle>Theme JSON</CardTitle>
                  <CardDescription>
                    Paste your theme JSON here (from AI or manual editing)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={themeJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Paste your theme JSON here..."
                    className="font-mono text-sm min-h-[400px]"
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <ThemePreview theme={previewTheme} />
            <p className="text-sm text-muted-foreground">
              {previewTheme
                ? `Previewing: ${previewTheme.name}`
                : "Using default theme"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
