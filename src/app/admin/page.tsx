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
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Upload,
  Loader2,
  FileArchive,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
}

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const res = await fetch("/api/quizzes");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    }
  }

  function resetImportDialog() {
    setSelectedFile(null);
    setImportError(null);
  }

  async function handleImport(file: File) {
    if (!file) {
      setImportError("Please choose a .zip file to import");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/quizzes/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Quiz imported");
        // Refresh the quiz list
        await fetchQuizzes();
        setImportDialogOpen(false);
        resetImportDialog();
      } else {
        setImportError(data.error || "Failed to import quiz");
        toast.error("Failed to import quiz", {
          description: data.error,
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportError("Something went wrong while importing the quiz.");
      toast.error("Failed to import quiz");
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your quiz collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Quiz
          </Button>
          <Link href="/admin/quiz/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) resetImportDialog();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Import Quiz</DialogTitle>
            <DialogDescription>
              Upload a quiz export (.zip) to add it to your collection. Images
              and translations are imported automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <FileArchive className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Need the export?</p>
                <p>
                  Use the Export button inside a quiz to download a .zip that
                  includes questions, sections, images, and translations.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizImportFile">Quiz export (.zip)</Label>
              <Input
                id="quizImportFile"
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  setImportError(null);
                }}
                disabled={importing}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} • {(selectedFile.size / 1024).toFixed(1)}{" "}
                  KB
                </p>
              )}
              {importError && (
                <p className="text-sm text-destructive">{importError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedFile && handleImport(selectedFile)}
              disabled={!selectedFile || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No quizzes yet</p>
            <Link href="/admin/quiz/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="group">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="truncate">{quiz.title}</span>
                </CardTitle>
                <CardDescription>
                  {quiz.questionCount} question
                  {quiz.questionCount !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {quiz.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/quiz/${quiz.id}/questions`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="w-3 h-3 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/host?quizId=${quiz.id}`}>
                    <Button
                      size="sm"
                      disabled={quiz.questionCount === 0}
                      title={
                        quiz.questionCount === 0
                          ? "Add questions first"
                          : "Start game"
                      }
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Play
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuiz(quiz.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
