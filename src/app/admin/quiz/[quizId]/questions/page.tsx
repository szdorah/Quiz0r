"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  Play,
  Image,
  Upload,
  Loader2,
  Layers,
  Palette,
  Download,
  Shield,
  Zap,
  AlertCircle,
} from "lucide-react";

// DnD Kit imports
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  autoAdmit: boolean;
  hintCount: number;
  copyAnswerCount: number;
  doublePointsCount: number;
  questions: Question[];
}

interface SectionGroup {
  section: Question | null;
  questions: Question[];
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
      // Save previous group if it has content
      if (currentGroup.section || currentGroup.questions.length > 0) {
        groups.push(currentGroup);
      }
      // Start new group with this section
      currentGroup = { section: q, questions: [] };
    } else {
      currentGroup.questions.push(q);
    }
  }
  // Don't forget the last group
  if (currentGroup.section || currentGroup.questions.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}

// Flatten groups back to a single array preserving order
function flattenGroups(groups: SectionGroup[]): Question[] {
  const result: Question[] = [];
  for (const group of groups) {
    if (group.section) {
      result.push(group.section);
    }
    result.push(...group.questions);
  }
  return result;
}

// Sortable Question Card Component
function SortableQuestionCard({
  question,
  questionNumber,
  onEdit,
  onDelete,
  isInSection,
}: {
  question: Question;
  questionNumber: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  isInSection: boolean;
}) {
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
      className={isInSection && !isSection ? "ml-8" : ""}
    >
      <Card
        className={`group ${isSection ? "border-primary/50 bg-primary/5" : ""} ${
          isDragging ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
            >
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
              <CardDescription className="flex items-center gap-3 mt-1">
                {isSection ? (
                  <>
                    <span className="text-primary font-medium">Section</span>
                    {question.hostNotes && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{question.hostNotes}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      {question.questionType === "MULTI_SELECT"
                        ? "Multi Select"
                        : "Single Select"}
                    </span>
                    <span>•</span>
                    <span>{question.timeLimit}s</span>
                    <span>•</span>
                    <span>{question.points} pts</span>
                  </>
                )}
                {question.imageUrl && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Image className="w-3 h-3 mr-1" />
                      Image
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(question)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isSection && question.answers.length > 0 && (
          <CardContent className="pt-0 pl-20">
            <div className="flex flex-wrap gap-2">
              {question.answers.map((answer, aIndex) => (
                <div
                  key={aIndex}
                  className={`text-sm px-3 py-1 rounded-full ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {answer.isCorrect && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {answer.answerText}
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
function DragOverlayCard({ question, questionNumber }: { question: Question; questionNumber: number }) {
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

export default function QuestionsPage({
  params,
}: {
  params: { quizId: string };
}) {
  const { quizId } = params;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hostNotes, setHostNotes] = useState("");
  const [hint, setHint] = useState("");
  const [questionType, setQuestionType] = useState("SINGLE_SELECT");
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);
  const [answers, setAnswers] = useState<Answer[]>([
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
  ]);
  const [easterEggEnabled, setEasterEggEnabled] = useState(false);
  const [easterEggButtonText, setEasterEggButtonText] = useState("Click for a surprise!");
  const [easterEggUrl, setEasterEggUrl] = useState("");
  const [easterEggDisablesScoring, setEasterEggDisablesScoring] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // DnD sensors
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

  // Group questions for visual display
  const sectionGroups = useMemo(
    () => (quiz ? groupQuestionsBySections(quiz.questions) : []),
    [quiz]
  );

  // Get the active dragging question
  const activeQuestion = useMemo(
    () => quiz?.questions.find((q) => q.id === activeId) || null,
    [quiz, activeId]
  );

  // Calculate question number for the active question
  const activeQuestionNumber = useMemo(() => {
    if (!activeQuestion || !quiz || activeQuestion.questionType === "SECTION") return 0;
    return quiz.questions
      .slice(0, quiz.questions.findIndex((q) => q.id === activeQuestion.id) + 1)
      .filter((q) => q.questionType !== "SECTION").length;
  }, [activeQuestion, quiz]);

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  async function fetchQuiz() {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      }
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!quiz) return;

    setExporting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/export`);

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to export quiz");
        return;
      }

      // Download the ZIP file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quiz.title.replace(/[^a-z0-9_-]/gi, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export quiz");
    } finally {
      setExporting(false);
    }
  }

  function resetForm() {
    setQuestionText("");
    setImageUrl("");
    setHostNotes("");
    setHint("");
    setQuestionType("SINGLE_SELECT");
    setTimeLimit(30);
    setPoints(100);
    setAnswers([
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
    ]);
    setEasterEggEnabled(false);
    setEasterEggButtonText("Click for a surprise!");
    setEasterEggUrl("");
    setEasterEggDisablesScoring(false);
    setEditingQuestion(null);
  }

  function openEditDialog(question: Question) {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setImageUrl(question.imageUrl || "");
    setHostNotes(question.hostNotes || "");
    setHint(question.hint || "");
    setQuestionType(question.questionType);
    setTimeLimit(question.timeLimit);
    setPoints(question.points);
    setAnswers(
      question.answers.map((a) => ({
        answerText: a.answerText,
        imageUrl: a.imageUrl,
        isCorrect: a.isCorrect,
      }))
    );
    setEasterEggEnabled((question as any).easterEggEnabled || false);
    setEasterEggButtonText((question as any).easterEggButtonText || "Click for a surprise!");
    setEasterEggUrl((question as any).easterEggUrl || "");
    setEasterEggDisablesScoring((question as any).easterEggDisablesScoring || false);
    // Open the appropriate dialog based on type
    if (question.questionType === "SECTION") {
      setSectionDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  }

  function openSectionDialog() {
    resetForm();
    setQuestionType("SECTION");
    setSectionDialogOpen(true);
  }

  async function saveSection() {
    if (!questionText.trim()) {
      alert("Section title is required");
      return;
    }

    const sectionData = {
      questionText,
      imageUrl: imageUrl || null,
      hostNotes: hostNotes || null,
      questionType: "SECTION",
      timeLimit: 0,
      points: 0,
      answers: [],
    };

    try {
      let res;
      if (editingQuestion) {
        res = await fetch(
          `/api/quizzes/${quizId}/questions/${editingQuestion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sectionData),
          }
        );
      } else {
        res = await fetch(`/api/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sectionData),
        });
      }

      if (res.ok) {
        setSectionDialogOpen(false);
        resetForm();
        fetchQuiz();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save section");
      }
    } catch (error) {
      console.error("Failed to save section:", error);
      alert("Failed to save section");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
  }

  function addAnswer() {
    setAnswers([...answers, { answerText: "", isCorrect: false }]);
  }

  function removeAnswer(index: number) {
    if (answers.length <= 2) return;
    setAnswers(answers.filter((_, i) => i !== index));
  }

  function updateAnswer(index: number, field: keyof Answer, value: unknown) {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };

    // For single select, ensure only one answer is correct
    if (field === "isCorrect" && value === true && questionType === "SINGLE_SELECT") {
      newAnswers.forEach((a, i) => {
        if (i !== index) a.isCorrect = false;
      });
    }

    setAnswers(newAnswers);
  }

  async function saveQuestion() {
    // Validate
    if (!questionText.trim()) {
      alert("Question text is required");
      return;
    }

    const validAnswers = answers.filter((a) => a.answerText.trim());

    if (validAnswers.length < 2) {
      alert("At least 2 answers are required");
      return;
    }

    if (!validAnswers.some((a) => a.isCorrect)) {
      alert("At least one answer must be marked as correct");
      return;
    }

    // Easter egg validation
    if (easterEggEnabled) {
      if (!easterEggButtonText.trim()) {
        alert("Easter egg button text is required");
        return;
      }
      if (!easterEggUrl.trim() || !easterEggUrl.match(/^https?:\/\/.+/)) {
        alert("Easter egg URL must be a valid HTTP/HTTPS URL");
        return;
      }
    }

    // Hint validation
    if (quiz && quiz.hintCount > 0 && !hint.trim()) {
      alert("Hint is required when Hint power-up is enabled");
      return;
    }

    const questionData = {
      questionText,
      imageUrl: imageUrl || null,
      hostNotes: hostNotes || null,
      hint: hint || null,
      questionType,
      timeLimit,
      points,
      answers: validAnswers,
      easterEggEnabled,
      easterEggButtonText: easterEggEnabled ? easterEggButtonText.trim() : null,
      easterEggUrl: easterEggEnabled ? easterEggUrl.trim() : null,
      easterEggDisablesScoring: easterEggEnabled ? easterEggDisablesScoring : false,
    };

    try {
      let res;
      if (editingQuestion) {
        res = await fetch(
          `/api/quizzes/${quizId}/questions/${editingQuestion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          }
        );
      } else {
        res = await fetch(`/api/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        });
      }

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchQuiz();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save question");
      }
    } catch (error) {
      console.error("Failed to save question:", error);
      alert("Failed to save question");
    }
  }

  async function updateAutoAdmit(autoAdmit: boolean) {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoAdmit }),
      });
      if (res.ok) {
        setQuiz((prev) => prev ? { ...prev, autoAdmit } : null);
      }
    } catch (error) {
      console.error("Failed to update auto-admit:", error);
    }
  }

  async function updatePowerUpCount(field: string, value: number) {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        // Update local state
        setQuiz((prev) => prev ? { ...prev, [field]: value } : null);
        // Refresh quiz data to update question warnings
        await fetchQuiz();
      }
    } catch (error) {
      console.error("Failed to update power-up count:", error);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuiz();
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  }

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !quiz || active.id === over.id) return;

    const oldIndex = quiz.questions.findIndex((q) => q.id === active.id);
    const newIndex = quiz.questions.findIndex((q) => q.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const draggedItem = quiz.questions[oldIndex];
    const isSection = draggedItem.questionType === "SECTION";

    let newQuestions: Question[];

    if (isSection) {
      // When dragging a section, also move all questions that belong to it
      const groups = groupQuestionsBySections(quiz.questions);
      const sectionGroupIndex = groups.findIndex((g) => g.section?.id === active.id);

      if (sectionGroupIndex === -1) return;

      const sectionGroup = groups[sectionGroupIndex];
      const itemsToMove = [sectionGroup.section!, ...sectionGroup.questions];

      // Remove the section group from groups
      const remainingGroups = groups.filter((_, i) => i !== sectionGroupIndex);

      // Find where to insert based on the over target
      const overItem = quiz.questions.find((q) => q.id === over.id);
      if (!overItem) return;

      // Find which group the over item belongs to
      let targetGroupIndex = -1;
      let insertAfterGroup = false;

      for (let i = 0; i < remainingGroups.length; i++) {
        const group = remainingGroups[i];
        if (group.section?.id === over.id) {
          targetGroupIndex = i;
          insertAfterGroup = oldIndex < newIndex;
          break;
        }
        if (group.questions.some((q) => q.id === over.id)) {
          targetGroupIndex = i;
          insertAfterGroup = true;
          break;
        }
      }

      // Create new groups array with the section group in the new position
      const newGroups: SectionGroup[] = [];

      if (targetGroupIndex === -1) {
        // Insert at beginning
        newGroups.push({ section: sectionGroup.section, questions: sectionGroup.questions });
        newGroups.push(...remainingGroups);
      } else {
        for (let i = 0; i < remainingGroups.length; i++) {
          if (!insertAfterGroup && i === targetGroupIndex) {
            newGroups.push({ section: sectionGroup.section, questions: sectionGroup.questions });
          }
          newGroups.push(remainingGroups[i]);
          if (insertAfterGroup && i === targetGroupIndex) {
            newGroups.push({ section: sectionGroup.section, questions: sectionGroup.questions });
          }
        }
      }

      newQuestions = flattenGroups(newGroups);
    } else {
      // Simple question reorder
      newQuestions = arrayMove(quiz.questions, oldIndex, newIndex);
    }

    // Optimistically update UI
    setQuiz({ ...quiz, questions: newQuestions });

    // Save to server
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: newQuestions.map((q) => q.id),
        }),
      });

      if (!res.ok) {
        // Revert on error
        fetchQuiz();
      }
    } catch (error) {
      console.error("Failed to reorder questions:", error);
      fetchQuiz();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Quiz not found</p>
        <Link href="/admin" className="text-primary hover:underline mt-2 inline-block">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  // Calculate question numbers
  let questionCounter = 0;
  const questionNumbers = new Map<string, number>();
  for (const q of quiz.questions) {
    if (q.questionType !== "SECTION") {
      questionCounter++;
      questionNumbers.set(q.id, questionCounter);
    }
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
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            {quiz.questions.length} item{quiz.questions.length !== 1 ? "s" : ""} •{" "}
            {quiz.questions.filter((q) => q.questionType !== "SECTION").length} question
            {quiz.questions.filter((q) => q.questionType !== "SECTION").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/host?quizId=${quizId}`}>
            <Button variant="outline" disabled={quiz.questions.filter((q) => q.questionType !== "SECTION").length === 0}>
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
          </Link>
          <Link href={`/admin/quiz/${quizId}/theme`}>
            <Button variant="outline">
              <Palette className="w-4 h-4 mr-2" />
              Theme
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExport} disabled={exporting || !quiz}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="outline" onClick={openSectionDialog}>
            <Layers className="w-4 h-4 mr-2" />
            Add Section
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edit" : "Add"} Question
                </DialogTitle>
                <DialogDescription>
                  Create a multiple choice question with 2-6 answer options.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question</Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>
                    <Image className="w-4 h-4 inline mr-2" />
                    Image (optional)
                  </Label>

                  {imageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={imageUrl}
                        alt="Question"
                        className="max-h-40 rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-24"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mb-1" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-sm">Click to upload image</span>
                            <span className="text-xs">JPEG, PNG, GIF, WebP (max 5MB)</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Or use URL */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">Or paste URL:</span>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Host Notes */}
                <div className="space-y-2">
                  <Label htmlFor="hostNotes">Host Notes (optional)</Label>
                  <Textarea
                    id="hostNotes"
                    placeholder="Notes visible only to the host during the quiz (e.g., talking points, fun facts, additional context)..."
                    value={hostNotes}
                    onChange={(e) => setHostNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes are shown to the host in the control panel during the question and when revealing answers.
                  </p>
                </div>

                {/* Hint */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hint">
                      Hint {quiz.hintCount > 0 && <span className="text-red-500">*</span>}
                    </Label>
                    {quiz.hintCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Required (Hint power-up enabled)
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="hint"
                    placeholder="Provide a helpful hint for this question..."
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    rows={2}
                    maxLength={200}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {hint.length}/200 characters
                  </p>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_SELECT">Single Select</SelectItem>
                      <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time & Points Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time (seconds)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min={5}
                      max={120}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min={10}
                      max={1000}
                      step={10}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAnswer}
                      disabled={answers.length >= 6}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {answers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={`Answer ${index + 1}`}
                        value={answer.answerText}
                        onChange={(e) =>
                          updateAnswer(index, "answerText", e.target.value)
                        }
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={answer.isCorrect}
                          onCheckedChange={(checked) =>
                            updateAnswer(index, "isCorrect", checked)
                          }
                        />
                        <span className="text-xs text-muted-foreground w-16">
                          {answer.isCorrect ? (
                            <span className="text-green-600 flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              Correct
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              Wrong
                            </span>
                          )}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(index)}
                        disabled={answers.length <= 2}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {questionType === "MULTI_SELECT" && (
                    <p className="text-xs text-muted-foreground">
                      Multiple answers can be marked as correct. Players get partial
                      credit for each correct answer selected.
                    </p>
                  )}
                </div>

                {/* Easter Egg Configuration */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="easterEgg">Easter Egg Button</Label>
                      <p className="text-xs text-muted-foreground">
                        Add a special button that opens a web page
                      </p>
                    </div>
                    <Switch
                      id="easterEgg"
                      checked={easterEggEnabled}
                      onCheckedChange={setEasterEggEnabled}
                    />
                  </div>

                  {easterEggEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="easterEggButtonText">Button Text</Label>
                        <Input
                          id="easterEggButtonText"
                          placeholder="Click for a surprise!"
                          value={easterEggButtonText}
                          onChange={(e) => setEasterEggButtonText(e.target.value)}
                          maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                          {easterEggButtonText.length}/50 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="easterEggUrl">URL</Label>
                        <Input
                          id="easterEggUrl"
                          type="url"
                          placeholder="https://example.com"
                          value={easterEggUrl}
                          onChange={(e) => setEasterEggUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Opens in a new tab when clicked. Must start with http:// or https://
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="disableScoring">Disable Scoring</Label>
                          <p className="text-xs text-muted-foreground">
                            Players who click won&apos;t earn points for this question
                          </p>
                        </div>
                        <Switch
                          id="disableScoring"
                          checked={easterEggDisablesScoring}
                          onCheckedChange={setEasterEggDisablesScoring}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveQuestion}>
                    {editingQuestion ? "Save Changes" : "Add Question"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Section Dialog */}
          <Dialog
            open={sectionDialogOpen}
            onOpenChange={(open) => {
              setSectionDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edit" : "Add"} Section
                </DialogTitle>
                <DialogDescription>
                  Add a section divider to introduce a new topic or group of questions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Section Title */}
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle">Section Title</Label>
                  <Input
                    id="sectionTitle"
                    placeholder="Enter section title..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="sectionDescription">Description (optional)</Label>
                  <Textarea
                    id="sectionDescription"
                    placeholder="Optional description or subtitle for this section..."
                    value={hostNotes}
                    onChange={(e) => setHostNotes(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    This description will be shown on the section slide.
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>
                    <Image className="w-4 h-4 inline mr-2" />
                    Image (optional)
                  </Label>

                  {imageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={imageUrl}
                        alt="Section"
                        className="max-h-40 rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        id="sectionImageUpload"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-20"
                        onClick={() => document.getElementById('sectionImageUpload')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin mb-1" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-sm">Click to upload</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Or paste URL:</span>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSectionDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveSection}>
                    {editingQuestion ? "Save Changes" : "Add Section"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Player Admission Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Player Admission
          </CardTitle>
          <CardDescription>
            Control how players join games using this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-admit">Auto-Admit Players</Label>
              <p className="text-sm text-muted-foreground">
                {quiz.autoAdmit
                  ? "New players join automatically"
                  : "New players require host approval"}
              </p>
            </div>
            <Switch
              id="auto-admit"
              checked={quiz.autoAdmit ?? true}
              onCheckedChange={updateAutoAdmit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Power-ups Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Power-ups
          </CardTitle>
          <CardDescription>
            Configure power-ups available to players during gameplay. Set to 0 to disable a power-up type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hint Power-up */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="hint-count">💡 Hint</Label>
              <p className="text-sm text-muted-foreground">
                Shows a hint for the question. All questions must have hints if enabled.
              </p>
            </div>
            <Input
              id="hint-count"
              type="number"
              min="0"
              max="10"
              className="w-20"
              value={quiz.hintCount}
              onChange={(e) => updatePowerUpCount('hintCount', parseInt(e.target.value))}
            />
          </div>

          {/* Copy Answer Power-up */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="copy-count">👥 Copy Answer</Label>
              <p className="text-sm text-muted-foreground">
                Copy another player's answer (blind copy - no preview).
              </p>
            </div>
            <Input
              id="copy-count"
              type="number"
              min="0"
              max="10"
              className="w-20"
              value={quiz.copyAnswerCount}
              onChange={(e) => updatePowerUpCount('copyAnswerCount', parseInt(e.target.value))}
            />
          </div>

          {/* Double Points Power-up */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="double-count">⚡ Double Points</Label>
              <p className="text-sm text-muted-foreground">
                Doubles the final score for the question (after speed bonus).
              </p>
            </div>
            <Input
              id="double-count"
              type="number"
              min="0"
              max="10"
              className="w-20"
              value={quiz.doublePointsCount}
              onChange={(e) => updatePowerUpCount('doublePointsCount', parseInt(e.target.value))}
            />
          </div>

          {quiz.hintCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hint Requirement</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  All questions must have a hint when Hint power-up is enabled. Questions without hints will show a warning.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions List with Drag and Drop */}
      {quiz.questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No questions yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={quiz.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sectionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  {/* Section Header */}
                  {group.section && (
                    <SortableQuestionCard
                      question={group.section}
                      questionNumber={0}
                      onEdit={openEditDialog}
                      onDelete={deleteQuestion}
                      isInSection={false}
                    />
                  )}
                  {/* Questions in this section */}
                  {group.questions.map((question) => (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      questionNumber={questionNumbers.get(question.id) || 0}
                      onEdit={openEditDialog}
                      onDelete={deleteQuestion}
                      isInSection={group.section !== null}
                    />
                  ))}
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeQuestion && (
              <DragOverlayCard
                question={activeQuestion}
                questionNumber={activeQuestionNumber}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
