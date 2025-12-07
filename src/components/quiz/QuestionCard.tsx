"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GripVertical, Check, Trash2, Layers, Image } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Answer {
  id?: string;
  answerText: string;
  imageUrl?: string | null;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  imageUrl?: string | null;
  hostNotes?: string | null;
  hint?: string | null;
  questionType: string;
  timeLimit: number;
  points: number;
  orderIndex: number;
  answers: Answer[];
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  isInSection: boolean;
}

export function SortableQuestionCard({
  question,
  questionNumber,
  onEdit,
  onDelete,
  isInSection,
}: QuestionCardProps) {
  const isSection = question.questionType === "SECTION";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isInSection && !isSection ? "ml-4 sm:ml-8" : ""}
    >
      <Card
        className={`group ${isSection ? "border-primary/50 bg-primary/5" : ""} ${
          isDragging ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex items-start gap-2 sm:gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-semibold text-xs sm:text-sm shrink-0 ${
                isSection
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isSection ? <Layers className="w-4 h-4" /> : questionNumber}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-medium leading-tight">
                {question.questionText}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1 text-xs sm:text-sm">
                {isSection ? (
                  <>
                    <span className="text-primary font-medium">Section</span>
                    {question.hostNotes && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate max-w-[200px]">
                          {question.hostNotes}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      {question.questionType === "MULTI_SELECT"
                        ? "Multi"
                        : "Single"}
                    </span>
                    <span>•</span>
                    <span>{question.timeLimit}s</span>
                    <span>•</span>
                    <span>{question.points}pts</span>
                  </>
                )}
                {question.imageUrl && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center">
                      <Image className="w-3 h-3 mr-1" />
                      Image
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(question)}
                className="h-8 px-2 sm:px-3"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
                className="text-destructive hover:text-destructive h-8 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isSection && question.answers.length > 0 && (
          <CardContent className="pt-0 pl-12 sm:pl-20 pr-3 sm:pr-6 pb-3">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {question.answers.map((answer, aIndex) => (
                <div
                  key={aIndex}
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {answer.isCorrect && (
                    <Check className="w-3 h-3 inline mr-0.5 sm:mr-1" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[150px] inline-block align-middle">
                    {answer.answerText}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Drag Overlay Card (shown while dragging)
export function DragOverlayCard({
  question,
  questionNumber,
}: {
  question: Question;
  questionNumber: number;
}) {
  const isSection = question.questionType === "SECTION";

  return (
    <Card
      className={`${isSection ? "border-primary/50 bg-primary/5" : ""} ring-2 ring-primary shadow-lg`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          <div className="p-1 -m-1 text-muted-foreground">
            <GripVertical className="w-5 h-5" />
          </div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
              isSection
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isSection ? <Layers className="w-4 h-4" /> : questionNumber}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium">
              {question.questionText}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export type { Question, Answer };
