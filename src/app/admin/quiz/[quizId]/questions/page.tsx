"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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
  questions: Question[];
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [questionType, setQuestionType] = useState("SINGLE_SELECT");
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);
  const [answers, setAnswers] = useState<Answer[]>([
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
    { answerText: "", isCorrect: false },
  ]);
  const [uploading, setUploading] = useState(false);

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

  function resetForm() {
    setQuestionText("");
    setImageUrl("");
    setQuestionType("SINGLE_SELECT");
    setTimeLimit(30);
    setPoints(100);
    setAnswers([
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
      { answerText: "", isCorrect: false },
    ]);
    setEditingQuestion(null);
  }

  function openEditDialog(question: Question) {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setImageUrl(question.imageUrl || "");
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
    setDialogOpen(true);
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

    const questionData = {
      questionText,
      imageUrl: imageUrl || null,
      questionType,
      timeLimit,
      points,
      answers: validAnswers,
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
            {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/host?quizId=${quizId}`}>
            <Button variant="outline" disabled={quiz.questions.length === 0}>
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
          </Link>
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
                  {editingQuestion ? "Edit Question" : "Add Question"}
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
                      <label className="flex-1">
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          {uploading ? (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <Loader2 className="w-8 h-8 animate-spin mb-2" />
                              <span className="text-sm">Uploading...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <Upload className="w-8 h-8 mb-2" />
                              <span className="text-sm">Click to upload image</span>
                              <span className="text-xs">JPEG, PNG, GIF, WebP (max 5MB)</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
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

                {/* Question Type & Settings */}
                <div className="grid grid-cols-3 gap-4">
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
        </div>
      </div>

      {/* Questions List */}
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
        <div className="space-y-3">
          {quiz.questions.map((question, index) => (
            <Card key={question.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-medium">
                      {question.questionText}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3 mt-1">
                      <span>
                        {question.questionType === "MULTI_SELECT"
                          ? "Multi Select"
                          : "Single Select"}
                      </span>
                      <span>•</span>
                      <span>{question.timeLimit}s</span>
                      <span>•</span>
                      <span>{question.points} pts</span>
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
                      onClick={() => openEditDialog(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pl-16">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
