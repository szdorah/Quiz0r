"use client";

import { useMemo } from "react";
import { AlertCircle, Clock, Award, HelpCircle } from "lucide-react";
import { SupportedLanguages, type LanguageCode, type TranslationStatus } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  timeLimit: number;
  points: number;
  hint?: string | null;
}

interface QuestionStatsBarProps {
  questions: Question[];
  hintPowerUpEnabled: boolean;
  translationStatuses: TranslationStatus[];
}

export function QuestionStatsBar({
  questions,
  hintPowerUpEnabled,
  translationStatuses,
}: QuestionStatsBarProps) {
  const stats = useMemo(() => {
    const actualQuestions = questions.filter((q) => q.questionType !== "SECTION");
    const sections = questions.filter((q) => q.questionType === "SECTION");

    const totalTime = actualQuestions.reduce((sum, q) => sum + q.timeLimit, 0);
    const totalPoints = actualQuestions.reduce((sum, q) => sum + q.points, 0);

    const questionsWithHints = actualQuestions.filter((q) => q.hint?.trim());
    const hintCoverage = {
      current: questionsWithHints.length,
      total: actualQuestions.length,
      complete: questionsWithHints.length === actualQuestions.length,
    };

    // Calculate estimated time including buffer for transitions
    const estimatedMinutes = Math.ceil((totalTime + actualQuestions.length * 5) / 60);

    return {
      questionCount: actualQuestions.length,
      sectionCount: sections.length,
      totalTime,
      estimatedMinutes,
      totalPoints,
      hintCoverage,
    };
  }, [questions]);

  const completedTranslations = useMemo(() => {
    return translationStatuses.filter((t) => t.isComplete);
  }, [translationStatuses]);

  const partialTranslations = useMemo(() => {
    return translationStatuses.filter((t) => !t.isComplete && t.translatedFields > 0);
  }, [translationStatuses]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {/* Question & Section Count */}
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{stats.questionCount}</span>
          <span>question{stats.questionCount !== 1 ? "s" : ""}</span>
          {stats.sectionCount > 0 && (
            <>
              <span>·</span>
              <span className="font-medium text-foreground">{stats.sectionCount}</span>
              <span>section{stats.sectionCount !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        <span className="hidden sm:inline text-muted-foreground/50">|</span>

        {/* Estimated Time */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Clock className="w-3.5 h-3.5" />
              <span>~{stats.estimatedMinutes} min</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estimated quiz duration</p>
            <p className="text-xs text-muted-foreground">
              {stats.totalTime}s total question time + transitions
            </p>
          </TooltipContent>
        </Tooltip>

        <span className="hidden sm:inline text-muted-foreground/50">|</span>

        {/* Total Points */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Award className="w-3.5 h-3.5" />
              <span>{stats.totalPoints.toLocaleString()} pts</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Maximum possible points</p>
          </TooltipContent>
        </Tooltip>

        {/* Hint Coverage - Only show if power-up enabled */}
        {hintPowerUpEnabled && stats.questionCount > 0 && (
          <>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1.5 cursor-help ${
                    !stats.hintCoverage.complete
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {!stats.hintCoverage.complete && (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>
                    Hints: {stats.hintCoverage.current}/{stats.hintCoverage.total}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stats.hintCoverage.complete ? (
                  <p>All questions have hints</p>
                ) : (
                  <p>
                    {stats.hintCoverage.total - stats.hintCoverage.current} question
                    {stats.hintCoverage.total - stats.hintCoverage.current !== 1
                      ? "s"
                      : ""}{" "}
                    missing hints
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Translation Status - Only show if there are translations */}
        {(completedTranslations.length > 0 || partialTranslations.length > 0) && (
          <>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  {completedTranslations.map((t) => (
                    <span key={t.languageCode} className="text-base leading-none">
                      {SupportedLanguages[t.languageCode]?.flag}
                    </span>
                  ))}
                  {partialTranslations.map((t) => (
                    <span
                      key={t.languageCode}
                      className="text-base leading-none opacity-50"
                    >
                      {SupportedLanguages[t.languageCode]?.flag}
                    </span>
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {completedTranslations.length > 0 && (
                    <p className="text-green-500">
                      Complete:{" "}
                      {completedTranslations
                        .map((t) => SupportedLanguages[t.languageCode]?.name)
                        .join(", ")}
                    </p>
                  )}
                  {partialTranslations.length > 0 && (
                    <p className="text-amber-500">
                      Partial:{" "}
                      {partialTranslations
                        .map((t) => SupportedLanguages[t.languageCode]?.name)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
