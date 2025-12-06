"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  SkipForward,
  BarChart3,
  Square,
  Users,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  FastForward,
  StickyNote,
  X,
  Eye,
  Layers,
  Trash2,
  UserCheck,
  UserX,
  Bell,
  Shield,
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
    playerAnswers,
    easterEggClicks,
    nextQuestionPreview,
    gameCancelled,
    admissionRequests,
    startGame,
    nextQuestion,
    showScoreboard,
    endGame,
    skipTimer,
    cancelGame,
    removePlayer,
    admitPlayer,
    refusePlayer,
    toggleAutoAdmit,
  } = useSocket({ gameCode, role: "host" });

  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<{ id: string; name: string } | null>(null);

  // Fetch tunnel URL on mount
  useEffect(() => {
    async function fetchTunnelUrl() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.tunnelUrl) {
          setTunnelUrl(data.tunnelUrl);
        }
      } catch (error) {
        console.error("Failed to fetch tunnel URL:", error);
      }
    }
    fetchTunnelUrl();
  }, []);

  // Poll for short URL created by display page
  useEffect(() => {
    if (!gameCode) return;

    let interval: NodeJS.Timeout | null = null;

    async function checkShortUrl() {
      try {
        const res = await fetch(`/api/shorten?gameCode=${gameCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.shortUrl) {
            setShortUrl(data.shortUrl);
            // Stop polling once we have the URL
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        }
      } catch (error) {
        console.error("Failed to retrieve short URL:", error);
      }
    }

    // Check immediately
    checkShortUrl();

    // Poll every 2 seconds until we get the URL
    interval = setInterval(checkShortUrl, 2000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameCode]);

  function copyExternalUrl() {
    if (tunnelUrl) {
      const fullUrl = `${tunnelUrl}/play/${gameCode}`;
      // Use short URL if available, otherwise fallback to full URL
      const urlToCopy = shortUrl || fullUrl;

      // Try modern clipboard API first, fallback to textarea method for non-secure contexts
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(urlToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          // Fallback if clipboard API fails
          fallbackCopy(urlToCopy);
        });
      } else {
        // Use fallback for non-secure contexts (like Docker without HTTPS)
        fallbackCopy(urlToCopy);
      }
    }
  }

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
    document.body.removeChild(textarea);
  }

  function openDisplay() {
    window.open(
      `/host/${gameCode}/display`,
      "quiz-display",
      "width=1280,height=720"
    );
  }

  function handleRemovePlayer(playerId: string, playerName: string) {
    setPlayerToRemove({ id: playerId, name: playerName });
    setRemoveDialogOpen(true);
  }

  function confirmRemovePlayer() {
    if (playerToRemove) {
      removePlayer(playerToRemove.id);
      setRemoveDialogOpen(false);
      setPlayerToRemove(null);
    }
  }

  function handleAdmitPlayer(playerId: string) {
    admitPlayer(playerId);
  }

  function handleRefusePlayer(playerId: string) {
    refusePlayer(playerId);
  }

  function handleToggleAutoAdmit(checked: boolean) {
    toggleAutoAdmit(checked);
  }

  // Get current question's answers for display
  const currentAnswers = currentQuestion
    ? playerAnswers.get(currentQuestion.id) || []
    : [];

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

  if (gameCancelled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl font-bold text-muted-foreground">
            Game Cancelled
          </div>
          <Link href="/host">
            <Button>Back to Host</Button>
          </Link>
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
    SECTION: "bg-indigo-500",
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
          <div className="flex items-center gap-2">
            {tunnelUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyExternalUrl}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Join URL
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={openDisplay}>
              <Monitor className="w-4 h-4 mr-2" />
              Open Display
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
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
                      {gameState.currentQuestionNumber} /{" "}
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
                    <Button
                      onClick={cancelGame}
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Game
                    </Button>
                  </div>
                )}

                {gameState.status === "QUESTION" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2 flex items-center gap-2">
                        Current Question:
                        {currentQuestion?.easterEggEnabled && (
                          <span className="text-lg" title="This question has an easter egg">
                            🥚
                          </span>
                        )}
                      </p>
                      <p className="text-lg">{currentQuestion?.questionText}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentQuestion?.questionType === "MULTI_SELECT"
                          ? "Multi-select"
                          : "Single select"}{" "}
                        • {currentQuestion?.points} points •{" "}
                        {currentQuestion?.timeLimit}s
                      </p>
                    </div>
                    {currentQuestion?.hostNotes && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">Host Notes</p>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 text-sm whitespace-pre-wrap">{currentQuestion.hostNotes}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {gameState.players.filter((p) => p.hasAnswered).length} of{" "}
                        {gameState.players.length} players answered
                      </div>
                      {gameState.players.filter((p) => p.hasAnswered).length ===
                        gameState.players.length &&
                        gameState.players.length > 0 && (
                          <Button onClick={skipTimer} variant="secondary" size="sm">
                            <FastForward className="w-4 h-4 mr-2" />
                            Skip Timer
                          </Button>
                        )}
                    </div>
                  </div>
                )}

                {gameState.status === "SECTION" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <p className="font-medium text-indigo-800 dark:text-indigo-300">Section</p>
                      </div>
                      <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                        {currentQuestion?.questionText}
                      </p>
                      {currentQuestion?.hostNotes && (
                        <p className="text-indigo-700 dark:text-indigo-300 mt-2">
                          {currentQuestion.hostNotes}
                        </p>
                      )}
                    </div>
                    {currentQuestion?.imageUrl && (
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Section"
                          className="max-h-48 mx-auto"
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Players are seeing this section slide. Click &quot;Continue&quot; when ready to proceed.
                    </p>
                    <Button onClick={nextQuestion} size="lg" className="w-full">
                      <SkipForward className="w-4 h-4 mr-2" />
                      Continue
                    </Button>
                  </div>
                )}

                {gameState.status === "REVEALING" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Showing correct answer...
                    </p>
                    {currentQuestion?.hostNotes && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">Host Notes</p>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 text-sm whitespace-pre-wrap">{currentQuestion.hostNotes}</p>
                      </div>
                    )}
                    {/* Next Question Preview */}
                    {nextQuestionPreview && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                            Up Next (Q{nextQuestionPreview.questionNumber} of {nextQuestionPreview.totalQuestions})
                          </p>
                        </div>
                        <p className="text-blue-900 dark:text-blue-200">{nextQuestionPreview.question.questionText}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {nextQuestionPreview.question.answers.map((answer, i) => (
                            <span
                              key={answer.id}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {String.fromCharCode(65 + i)}. {answer.answerText}
                            </span>
                          ))}
                        </div>
                        {nextQuestionPreview.question.hostNotes && (
                          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 italic">
                            Notes: {nextQuestionPreview.question.hostNotes}
                          </p>
                        )}
                      </div>
                    )}
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
                    {/* Next Question Preview */}
                    {nextQuestionPreview && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                            Up Next (Q{nextQuestionPreview.questionNumber} of {nextQuestionPreview.totalQuestions})
                          </p>
                        </div>
                        <p className="text-blue-900 dark:text-blue-200">{nextQuestionPreview.question.questionText}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {nextQuestionPreview.question.answers.map((answer, i) => (
                            <span
                              key={answer.id}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {String.fromCharCode(65 + i)}. {answer.answerText}
                            </span>
                          ))}
                        </div>
                        {nextQuestionPreview.question.hostNotes && (
                          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 italic">
                            Notes: {nextQuestionPreview.question.hostNotes}
                          </p>
                        )}
                      </div>
                    )}
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

            {/* Player Answers Card - shown during QUESTION and REVEALING */}
            {(gameState.status === "QUESTION" ||
              gameState.status === "REVEALING") &&
              currentQuestion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Player Answers</span>
                      <Badge variant="secondary">
                        {currentAnswers.length} / {gameState.players.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentAnswers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Waiting for answers...
                        </p>
                      ) : (
                        currentAnswers
                          .sort((a, b) => a.timeToAnswer - b.timeToAnswer)
                          .map((answer) => (
                            <div
                              key={answer.playerId}
                              className={`
                                flex items-center gap-3 p-2 rounded-lg border
                                ${answer.isCorrect ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"}
                              `}
                            >
                              {answer.avatarEmoji?.startsWith("/") ? (
                              <img
                                src={answer.avatarEmoji}
                                alt={answer.playerName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback
                                  style={{ backgroundColor: answer.avatarEmoji ? "transparent" : answer.avatarColor }}
                                  className={answer.avatarEmoji ? "text-xl" : "text-white text-xs"}
                                >
                                  {answer.avatarEmoji || answer.playerName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">
                                    {answer.playerName}
                                  </p>
                                  {answer.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                  )}
                                  {easterEggClicks.get(currentQuestion.id)?.some((click) => click.playerId === answer.playerId) && (
                                    <span className="text-base" title="Clicked easter egg">
                                      🥚
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {(answer.timeToAnswer / 1000).toFixed(1)}s
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">
                                  +{answer.pointsEarned}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Total: {answer.totalScore} (#{answer.position})
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar - Players/Scores */}
          <div className="space-y-6">
            {/* Admission Control Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admission Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Player Admission:</span>
                    <span className={`text-sm px-2 py-1 rounded-md ${
                      gameState.autoAdmit
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}>
                      {gameState.autoAdmit ? "Automatic" : "Requires Approval"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gameState.autoAdmit
                      ? "New players join automatically"
                      : "New players require host approval before joining"}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Configure this setting when creating the quiz
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admission Requests */}
            {admissionRequests.length > 0 && (
              <Card className="border-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-500" />
                    Admission Requests ({admissionRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {admissionRequests.map((request) => (
                      <div
                        key={request.playerId}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border-2 border-yellow-200 dark:border-yellow-800"
                      >
                        <p className="font-medium text-lg">{request.playerName}</p>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleAdmitPlayer(request.playerId)}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial"
                            title="Admit player to game"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Admit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRefusePlayer(request.playerId)}
                            title="Refuse player admission"
                            className="flex-1 sm:flex-initial"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Refuse
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        {player.avatarEmoji?.startsWith("/") ? (
                          <img
                            src={player.avatarEmoji}
                            alt={player.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback
                              style={{ backgroundColor: player.avatarEmoji ? "transparent" : player.avatarColor }}
                              className={player.avatarEmoji ? "text-xl" : "text-white text-xs"}
                            >
                              {player.avatarEmoji || player.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{player.name}</p>
                          {!isActive && (
                            <p className="text-xs text-muted-foreground">
                              Disconnected
                            </p>
                          )}
                        </div>

                        {/* Download Progress Indicator */}
                        {playerInfo?.downloadStatus?.status === 'loading' && (
                          <div className="flex items-center gap-2 mr-2">
                            <Progress
                              value={playerInfo.downloadStatus.percentage}
                              className="w-16 h-2"
                            />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {Math.round(playerInfo.downloadStatus.percentage)}%
                            </span>
                          </div>
                        )}
                        {playerInfo?.downloadStatus?.status === 'complete' && (
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                        )}

                        {/* Easter Egg Indicator */}
                        {currentQuestion?.easterEggEnabled &&
                          easterEggClicks.get(currentQuestion.id)?.some((click) => click.playerId === player.playerId) && (
                            <span className="text-sm mr-2" title="Clicked easter egg">
                              🥚
                            </span>
                          )}

                        <span className="font-bold text-primary mr-2">
                          {player.score}
                        </span>

                        {/* Remove Player Button */}
                        <button
                          onClick={() => handleRemovePlayer(player.playerId, player.name)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                          title="Remove player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Remove Player Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Player?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{playerToRemove?.name}</strong> from the game?
              They will be able to request to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemovePlayer}
            >
              Remove Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
