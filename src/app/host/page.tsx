"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Play, Monitor, Loader2 } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  questionCount: number;
}

function HostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedQuizId = searchParams.get("quizId");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(preselectedQuizId || "");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchQuizzes() {
    try {
      const res = await fetch("/api/quizzes");
      if (res.ok) {
        const data = await res.json();
        // Filter to only quizzes with questions
        const withQuestions = data.filter(
          (q: Quiz) => q.questionCount > 0
        );
        setQuizzes(withQuestions);

        // Auto-select if preselected
        if (preselectedQuizId && withQuestions.some((q: Quiz) => q.id === preselectedQuizId)) {
          setSelectedQuizId(preselectedQuizId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createGame() {
    if (!selectedQuizId) return;

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: selectedQuizId }),
      });

      if (res.ok) {
        const game = await res.json();
        // Open display window
        window.open(
          `/host/${game.gameCode}/display`,
          "quiz-display",
          "width=1280,height=720"
        );
        // Navigate to control panel
        router.push(`/host/${game.gameCode}/control`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create game");
      }
    } catch {
      setError("Failed to create game");
    } finally {
      setCreating(false);
    }
  }

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Host a Game
          </CardTitle>
          <CardDescription>
            Select a quiz to start a new game session. Players will be able to
            join using a QR code or game code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No quizzes available. Create a quiz first!
              </p>
              <Link href="/admin/quiz/new">
                <Button>Create Quiz</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Quiz</label>
                <Select
                  value={selectedQuizId}
                  onValueChange={setSelectedQuizId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questionCount} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuiz && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">{selectedQuiz.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuiz.questionCount} question
                    {selectedQuiz.questionCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col gap-4">
                <Button
                  onClick={createGame}
                  disabled={!selectedQuizId || creating}
                  size="lg"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {creating ? "Creating Game..." : "Start Game"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  This will open two windows: a display window for sharing on
                  Teams, and a control panel for managing the game.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function HostPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Quiz0r
          </Link>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage Quizzes
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <HostPageContent />
      </Suspense>
    </div>
  );
}
