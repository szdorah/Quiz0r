"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Trophy, Medal, Award, Loader2 } from "lucide-react";

export default function PlayerGamePage({
  params,
}: {
  params: { gameCode: string };
}) {
  const { gameCode } = params;
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    answerResult,
    questionEnded,
    error,
    submitAnswer,
  } = useSocket({
    gameCode,
    role: "player",
    playerName: joined ? playerName : undefined,
  });

  // Reset selected answers when question changes
  useEffect(() => {
    setSelectedAnswers(new Set());
    setHasSubmitted(false);
  }, [currentQuestion?.id]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");

    const name = playerName.trim();
    if (!name) {
      setJoinError("Please enter your name");
      return;
    }

    if (name.length > 20) {
      setJoinError("Name must be 20 characters or less");
      return;
    }

    setJoining(true);

    try {
      const res = await fetch(`/api/games/${gameCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setJoined(true);
      } else {
        const data = await res.json();
        setJoinError(data.error || "Failed to join game");
      }
    } catch {
      setJoinError("Failed to join game");
    } finally {
      setJoining(false);
    }
  }

  function toggleAnswer(answerId: string) {
    if (hasSubmitted) return;

    const newSelected = new Set(selectedAnswers);

    if (currentQuestion?.questionType === "SINGLE_SELECT") {
      // Single select - replace selection
      newSelected.clear();
      newSelected.add(answerId);
      // Auto-submit for single select
      submitAnswer(currentQuestion.id, [answerId]);
      setHasSubmitted(true);
    } else {
      // Multi select - toggle
      if (newSelected.has(answerId)) {
        newSelected.delete(answerId);
      } else {
        newSelected.add(answerId);
      }
    }

    setSelectedAnswers(newSelected);
  }

  function handleSubmitMultiSelect() {
    if (!currentQuestion || hasSubmitted || selectedAnswers.size === 0) return;
    submitAnswer(currentQuestion.id, Array.from(selectedAnswers));
    setHasSubmitted(true);
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <X className="w-12 h-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">{error}</p>
            <Button onClick={() => router.push("/play")} className="mt-4">
              Try Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not joined yet - show name entry
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Game</CardTitle>
            <p className="text-muted-foreground font-mono text-lg">{gameCode}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  className="text-center text-lg h-12"
                  maxLength={20}
                  autoFocus
                  disabled={joining}
                />
                {joinError && (
                  <p className="text-sm text-destructive text-center">
                    {joinError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connecting
  if (!connected || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Connecting to game...</p>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (gameState.status === "WAITING") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re In!</h2>
            <p className="text-lg font-medium mb-4">{playerName}</p>
            <p className="text-muted-foreground">
              Waiting for host to start the game...
            </p>
            <div className="mt-6 text-sm text-muted-foreground">
              {gameState.players.length} player
              {gameState.players.length !== 1 ? "s" : ""} joined
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question view
  if (
    gameState.status === "QUESTION" ||
    (gameState.status === "REVEALING" && currentQuestion)
  ) {
    const isRevealing = gameState.status === "REVEALING";
    const correctIds = questionEnded?.correctAnswerIds || [];
    const answerColors = [
      "bg-red-500 hover:bg-red-600",
      "bg-blue-500 hover:bg-blue-600",
      "bg-yellow-500 hover:bg-yellow-600",
      "bg-green-500 hover:bg-green-600",
      "bg-purple-500 hover:bg-purple-600",
      "bg-orange-500 hover:bg-orange-600",
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Timer */}
        {!isRevealing && currentQuestion && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Question {gameState.currentQuestionIndex + 1}
              </span>
              <span className="text-2xl font-bold text-primary">
                {timeRemaining}s
              </span>
            </div>
            <Progress
              value={(timeRemaining / currentQuestion.timeLimit) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Question */}
        <div className="p-4">
          <h2 className="text-xl font-bold text-center mb-2">
            {currentQuestion?.questionText}
          </h2>
          {currentQuestion?.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt="Question"
              className="max-h-32 mx-auto rounded-lg mb-4"
            />
          )}
          {currentQuestion?.questionType === "MULTI_SELECT" && !hasSubmitted && (
            <p className="text-sm text-center text-muted-foreground mb-2">
              Select all that apply
            </p>
          )}
        </div>

        {/* Answer Result (shown during revealing) */}
        {isRevealing && answerResult && (
          <div
            className={`mx-4 p-4 rounded-lg text-center mb-4 ${
              answerResult.correct
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <p className="text-2xl font-bold">
              {answerResult.correct ? "Correct!" : "Wrong!"}
            </p>
            <p className="text-lg">+{answerResult.points} points</p>
            <p className="text-sm">Position: #{answerResult.position}</p>
          </div>
        )}

        {/* Answers */}
        <div className="flex-1 p-4 space-y-3">
          {currentQuestion?.answers.map((answer, index) => {
            const isSelected = selectedAnswers.has(answer.id);
            const isCorrect = correctIds.includes(answer.id);
            const wasSelected = isSelected;

            let buttonClass = answerColors[index % answerColors.length];

            if (isRevealing) {
              if (isCorrect) {
                buttonClass = "bg-green-500 ring-4 ring-green-300";
              } else if (wasSelected && !isCorrect) {
                buttonClass = "bg-red-500 opacity-50";
              } else {
                buttonClass = "bg-gray-400 opacity-50";
              }
            } else if (hasSubmitted) {
              if (isSelected) {
                buttonClass = answerColors[index % answerColors.length] + " ring-4 ring-white";
              } else {
                buttonClass = "bg-gray-400 opacity-50";
              }
            } else if (isSelected) {
              buttonClass =
                answerColors[index % answerColors.length] + " ring-4 ring-white";
            }

            return (
              <button
                key={answer.id}
                onClick={() => toggleAnswer(answer.id)}
                disabled={hasSubmitted || isRevealing}
                className={`
                  w-full p-4 rounded-xl text-white text-lg font-medium
                  transition-all duration-200 flex items-center gap-3
                  ${buttonClass}
                  ${!hasSubmitted && !isRevealing ? "active:scale-95" : ""}
                `}
              >
                <span className="font-bold text-xl">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-left">{answer.answerText}</span>
                {isRevealing && isCorrect && <Check className="w-6 h-6" />}
                {isRevealing && wasSelected && !isCorrect && (
                  <X className="w-6 h-6" />
                )}
              </button>
            );
          })}
        </div>

        {/* Submit button for multi-select */}
        {currentQuestion?.questionType === "MULTI_SELECT" &&
          !hasSubmitted &&
          !isRevealing && (
            <div className="p-4 border-t">
              <Button
                onClick={handleSubmitMultiSelect}
                disabled={selectedAnswers.size === 0}
                size="lg"
                className="w-full"
              >
                Submit Answer ({selectedAnswers.size} selected)
              </Button>
            </div>
          )}

        {/* Waiting message after submit */}
        {hasSubmitted && !isRevealing && (
          <div className="p-4 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Waiting for time to expire...
          </div>
        )}
      </div>
    );
  }

  // Scoreboard
  if (gameState.status === "SCOREBOARD" || gameState.status === "FINISHED") {
    const isFinished = gameState.status === "FINISHED";
    const displayScores =
      scores.length > 0
        ? scores
        : gameState.players.map((p, i) => ({
            ...p,
            playerId: p.id,
            position: i + 1,
            change: 0,
          }));

    const myScore = displayScores.find(
      (s) => s.name.toLowerCase() === playerName.toLowerCase()
    );
    const myPosition = myScore?.position || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background p-4">
        {/* My Position */}
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            {myPosition <= 3 && isFinished && (
              <div className="mb-2">
                {myPosition === 1 && (
                  <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
                )}
                {myPosition === 2 && (
                  <Medal className="w-12 h-12 mx-auto text-gray-400" />
                )}
                {myPosition === 3 && (
                  <Award className="w-12 h-12 mx-auto text-amber-600" />
                )}
              </div>
            )}
            <p className="text-4xl font-bold text-primary">#{myPosition}</p>
            <p className="text-lg font-medium">{playerName}</p>
            <p className="text-2xl font-bold mt-2">{myScore?.score || 0} pts</p>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <h2 className="text-lg font-bold mb-3">
          {isFinished ? "Final Results" : "Leaderboard"}
        </h2>
        <div className="space-y-2">
          {displayScores.slice(0, 10).map((player, index) => {
            const isMe =
              player.name.toLowerCase() === playerName.toLowerCase();
            return (
              <div
                key={player.playerId}
                className={`
                  flex items-center gap-3 p-3 rounded-lg
                  ${isMe ? "bg-primary/10 ring-2 ring-primary" : "bg-card"}
                `}
              >
                <span className="font-bold w-6 text-center">{index + 1}</span>
                <Avatar className="w-8 h-8">
                  <AvatarFallback
                    style={{ backgroundColor: player.avatarColor }}
                    className="text-white text-xs"
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={`flex-1 ${isMe ? "font-bold" : ""}`}>
                  {player.name}
                  {isMe && " (You)"}
                </span>
                <span className="font-bold text-primary">{player.score}</span>
              </div>
            );
          })}
        </div>

        {isFinished && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">Thanks for playing!</p>
            <Button onClick={() => router.push("/play")}>Play Again</Button>
          </div>
        )}
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
