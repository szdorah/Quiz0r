"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Play, Upload } from "lucide-react";
import { toast } from "sonner";

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
  const importFileRef = useRef<HTMLInputElement>(null);

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

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
        toast.success(data.message);
        // Refresh the quiz list
        fetchQuizzes();
      } else {
        toast.error(data.error || "Failed to import quiz");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import quiz");
    } finally {
      setImporting(false);
      if (importFileRef.current) {
        importFileRef.current.value = "";
      }
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
          <input
            ref={importFileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
          <Button
            variant="outline"
            onClick={() => importFileRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "Importing..." : "Import Quiz"}
          </Button>
          <Link href="/admin/quiz/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

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
