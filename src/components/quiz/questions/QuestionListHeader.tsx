"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Layers,
  Plus,
  Settings,
  Palette,
  Languages,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QuestionStatsBar } from "./QuestionStatsBar";
import type { TranslationStatus } from "@/types";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  timeLimit: number;
  points: number;
  hint?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  hintCount: number;
  questions: Question[];
}

interface QuestionListHeaderProps {
  quiz: Quiz;
  translationStatuses: TranslationStatus[];
  onAddQuestion: () => void;
  onAddSection: () => void;
  onToggleSettings: () => void;
  onOpenTranslations: () => void;
  onExportQuiz: () => void;
  isExporting?: boolean;
  settingsOpen: boolean;
}

export function QuestionListHeader({
  quiz,
  translationStatuses,
  onAddQuestion,
  onAddSection,
  onToggleSettings,
  onOpenTranslations,
  onExportQuiz,
  isExporting = false,
  settingsOpen,
}: QuestionListHeaderProps) {
  const actualQuestionCount = quiz.questions.filter(
    (q) => q.questionType !== "SECTION"
  ).length;
  const canPlay = actualQuestionCount > 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Navigation and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Quizzes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{quiz.title}</h1>
        </div>

        {/* Action Buttons */}
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2">
            {/* Secondary Actions (Icon Buttons) */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/admin/quiz/${quiz.id}/theme`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Palette className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Theme</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={onOpenTranslations}
                  >
                    <Languages className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Translations</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={onExportQuiz}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Quiz</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/host?quizId=${quiz.id}`}>
                <Button disabled={!canPlay} size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Play</span>
                </Button>
              </Link>

              <Button variant="outline" size="sm" onClick={onAddSection}>
                <Layers className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Section</span>
              </Button>

              <Button size="sm" onClick={onAddQuestion}>
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Question</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={settingsOpen ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={onToggleSettings}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Stats Bar */}
      <QuestionStatsBar
        questions={quiz.questions}
        hintPowerUpEnabled={quiz.hintCount > 0}
        translationStatuses={translationStatuses}
      />
    </div>
  );
}
