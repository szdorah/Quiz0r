"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { QuestionCard, QuestionCardOverlay } from "./QuestionCard";
import { QuestionEmptyState } from "./QuestionEmptyState";
import type { LanguageCode, TranslationStatus } from "@/types";

interface Answer {
  id?: string;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  imageUrl?: string | null;
  questionType: string;
  timeLimit: number;
  points: number;
  hostNotes?: string | null;
  hint?: string | null;
  orderIndex: number;
  answers: Answer[];
}

interface SectionGroup {
  section: Question | null;
  questions: Question[];
}

interface QuestionListProps {
  questions: Question[];
  hintRequired: boolean;
  translationStatuses: TranslationStatus[];
  questionTranslationStatuses: Map<
    string,
    {
      status: "complete" | "partial" | "none";
      completeLanguages: LanguageCode[];
      partialLanguages: LanguageCode[];
    }
  >;
  activeId: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onDuplicate: (questionId: string) => void;
  onAddQuestion: () => void;
}

// Group questions by sections for visual display
function groupQuestionsBySections(questions: Question[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let currentGroup: SectionGroup = {
    section: null,
    questions: [],
  };

  for (const q of questions) {
    if (q.questionType === "SECTION") {
      if (currentGroup.section || currentGroup.questions.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { section: q, questions: [] };
    } else {
      currentGroup.questions.push(q);
    }
  }

  if (currentGroup.section || currentGroup.questions.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// Calculate question numbers (excluding sections)
function calculateQuestionNumbers(questions: Question[]): Map<string, number> {
  const numbers = new Map<string, number>();
  let questionNum = 1;

  for (const q of questions) {
    if (q.questionType !== "SECTION") {
      numbers.set(q.id, questionNum++);
    }
  }

  return numbers;
}

export function QuestionList({
  questions,
  hintRequired,
  translationStatuses,
  questionTranslationStatuses,
  activeId,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onDuplicate,
  onAddQuestion,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sectionGroups = useMemo(
    () => groupQuestionsBySections(questions),
    [questions]
  );

  const questionNumbers = useMemo(
    () => calculateQuestionNumbers(questions),
    [questions]
  );

  const activeQuestion = activeId
    ? questions.find((q) => q.id === activeId)
    : null;
  const activeQuestionNumber = activeId
    ? questionNumbers.get(activeId) || 0
    : 0;

  // Check if we have any translations at all
  const hasTranslations =
    translationStatuses.some((t) => t.translatedFields > 0) ||
    Array.from(questionTranslationStatuses.values()).some(
      (info) =>
        info.completeLanguages.length > 0 || info.partialLanguages.length > 0
    );

  if (questions.length === 0) {
    return <QuestionEmptyState onAddQuestion={onAddQuestion} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {sectionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {/* Section Header */}
              {group.section && (() => {
                const sectionTranslationInfo = questionTranslationStatuses.get(group.section.id);
                return (
                  <QuestionCard
                    question={group.section}
                    questionNumber={0}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    isInSection={false}
                    hintRequired={false}
                    showHintWarning={false}
                    translationStatus={
                      hasTranslations
                        ? sectionTranslationInfo?.status || "none"
                        : "none"
                    }
                    completeLanguages={sectionTranslationInfo?.completeLanguages || []}
                    partialLanguages={sectionTranslationInfo?.partialLanguages || []}
                  />
                );
              })()}

              {/* Questions in this section */}
              {group.questions.map((question) => {
                const translationInfo = questionTranslationStatuses.get(question.id);
                const showHintWarning =
                  hintRequired && !question.hint?.trim();

                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={questionNumbers.get(question.id) || 0}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    isInSection={group.section !== null}
                    hintRequired={hintRequired}
                    showHintWarning={showHintWarning}
                    translationStatus={
                      hasTranslations
                        ? translationInfo?.status || "none"
                        : "none"
                    }
                    completeLanguages={translationInfo?.completeLanguages || []}
                    partialLanguages={translationInfo?.partialLanguages || []}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeQuestion && (
          <QuestionCardOverlay
            question={activeQuestion}
            questionNumber={activeQuestionNumber}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
