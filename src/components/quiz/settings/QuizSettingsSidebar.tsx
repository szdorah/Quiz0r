"use client";

import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PlayerAdmissionCard } from "./PlayerAdmissionCard";
import { PowerUpsCard } from "./PowerUpsCard";

interface Question {
  id: string;
  questionType: string;
  hint?: string | null;
}

interface Quiz {
  id: string;
  autoAdmit: boolean;
  hintCount: number;
  copyAnswerCount: number;
  doublePointsCount: number;
  questions: Question[];
}

interface QuizSettingsSidebarProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAutoAdmit: (value: boolean) => void;
  onUpdatePowerUp: (field: string, value: number) => void;
}

export function QuizSettingsSidebar({
  quiz,
  isOpen,
  onClose,
  onUpdateAutoAdmit,
  onUpdatePowerUp,
}: QuizSettingsSidebarProps) {
  // Calculate questions without hints
  const questionsWithoutHints = quiz.questions.filter(
    (q) => q.questionType !== "SECTION" && !q.hint?.trim()
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quiz Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <PlayerAdmissionCard
            autoAdmit={quiz.autoAdmit}
            onUpdateAutoAdmit={onUpdateAutoAdmit}
          />

          <Separator />

          <PowerUpsCard
            hintCount={quiz.hintCount}
            copyAnswerCount={quiz.copyAnswerCount}
            doublePointsCount={quiz.doublePointsCount}
            questionsWithoutHints={questionsWithoutHints}
            onUpdatePowerUp={onUpdatePowerUp}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
