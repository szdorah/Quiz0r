"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  SkipForward,
  BarChart3,
  Square,
  Users,
  Monitor,
  ExternalLink,
} from "lucide-react";

export default function HostControlPage({
  params,
}: {
  params: { gameCode: string };
}) {
  const { gameCode } = params;
  const {
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    startGame,
    nextQuestion,
    showScoreboard,
    endGame,
  } = useSocket({ gameCode, role: "host" });

  function openDisplay() {
    window.open(
      `/host/${gameCode}/display`,
      "quiz-display",
      "width=1280,height=720"
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-xl font-bold text-primary">
            Connecting to game...
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl font-bold text-muted-foreground">
            Game not found
          </div>
          <Link href="/host">
            <Button>Back to Host</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    WAITING: "bg-yellow-500",
    ACTIVE: "bg-blue-500",
    QUESTION: "bg-green-500",
    REVEALING: "bg-purple-500",
    SCOREBOARD: "bg-orange-500",
    FINISHED: "bg-gray-500",
  };

  const displayScores = scores.length > 0
    ? scores
    : gameState.players.map((p, i) => ({
        ...p,
        playerId: p.id,
        position: i + 1,
        change: 0,
      }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-primary">
              Quiz Master
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg">{gameCode}</span>
              <Badge className={statusColors[gameState.status]}>
                {gameState.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openDisplay}>
            <Monitor className="w-4 h-4 mr-2" />
            Open Display
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <div className="md:col-span-2 space-y-6">
            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle>{gameState.quizTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Question: </span>
                    <span className="font-medium">
                      {gameState.currentQuestionIndex + 1} /{" "}
                      {gameState.totalQuestions}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Players: </span>
                    <span className="font-medium">
                      {gameState.players.filter((p) => p.isActive).length}
                    </span>
                  </div>
                  {gameState.status === "QUESTION" && (
                    <div>
                      <span className="text-muted-foreground">Time: </span>
                      <span className="font-bold text-primary">
                        {timeRemaining}s
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Control Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Game Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameState.status === "WAITING" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      {gameState.players.length === 0
                        ? "Waiting for players to join..."
                        : `${gameState.players.length} player${
                            gameState.players.length !== 1 ? "s" : ""
                          } ready`}
                    </p>
                    <Button
                      onClick={startGame}
                      disabled={gameState.players.length === 0}
                      size="lg"
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                  </div>
                )}

                {gameState.status === "QUESTION" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Current Question:</p>
                      <p className="text-lg">{currentQuestion?.questionText}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentQuestion?.questionType === "MULTI_SELECT"
                          ? "Multi-select"
                          : "Single select"}{" "}
                        • {currentQuestion?.points} points •{" "}
                        {currentQuestion?.timeLimit}s
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {gameState.players.filter((p) => p.hasAnswered).length} of{" "}
                      {gameState.players.length} players answered
                    </div>
                  </div>
                )}

                {gameState.status === "REVEALING" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Showing correct answer...
                    </p>
                    <div className="flex gap-4">
                      <Button
                        onClick={showScoreboard}
                        variant="outline"
                        className="flex-1"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Show Scoreboard
                      </Button>
                      <Button onClick={nextQuestion} className="flex-1">
                        <SkipForward className="w-4 h-4 mr-2" />
                        Next Question
                      </Button>
                    </div>
                  </div>
                )}

                {gameState.status === "SCOREBOARD" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Showing scoreboard...
                    </p>
                    {gameState.currentQuestionIndex <
                    gameState.totalQuestions - 1 ? (
                      <Button onClick={nextQuestion} size="lg" className="w-full">
                        <SkipForward className="w-4 h-4 mr-2" />
                        Next Question
                      </Button>
                    ) : (
                      <Button
                        onClick={endGame}
                        variant="destructive"
                        size="lg"
                        className="w-full"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Game
                      </Button>
                    )}
                  </div>
                )}

                {gameState.status === "FINISHED" && (
                  <div className="space-y-4 text-center">
                    <p className="text-xl font-bold text-green-600">
                      Game Complete!
                    </p>
                    <Link href="/host">
                      <Button size="lg" className="w-full">
                        Start New Game
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Emergency End Button */}
                {gameState.status !== "WAITING" &&
                  gameState.status !== "FINISHED" && (
                    <Button
                      onClick={endGame}
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Game Early
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Players/Scores */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Players ({gameState.players.filter((p) => p.isActive).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {displayScores.map((player, index) => {
                    const playerInfo = gameState.players.find(
                      (p) => p.id === player.playerId
                    );
                    const isActive = playerInfo?.isActive ?? true;
                    return (
                      <div
                        key={player.playerId}
                        className={`
                          flex items-center gap-3 p-2 rounded-lg
                          ${!isActive ? "opacity-50" : ""}
                          ${index === 0 && gameState.status !== "WAITING" ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}
                        `}
                      >
                        <span className="text-sm font-bold w-5 text-center text-muted-foreground">
                          {index + 1}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            style={{ backgroundColor: player.avatarColor }}
                            className="text-white text-xs"
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{player.name}</p>
                          {!isActive && (
                            <p className="text-xs text-muted-foreground">
                              Disconnected
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-primary">
                          {player.score}
                        </span>
                      </div>
                    );
                  })}
                  {gameState.players.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No players yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
