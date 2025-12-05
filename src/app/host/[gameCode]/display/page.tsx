"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSocket } from "@/hooks/useSocket";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Trophy, Medal, Award } from "lucide-react";

export default function HostDisplayPage({
  params,
}: {
  params: { gameCode: string };
}) {
  const { gameCode } = params;
  const [baseUrl, setBaseUrl] = useState("");

  // Poll for tunnel URL - keeps checking until we get an external URL
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function detectUrl() {
      // Check for active tunnel
      try {
        const res = await fetch("/api/tunnel");
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setBaseUrl(data.url);
            // Stop polling once we have a tunnel URL
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            return true;
          }
        }
      } catch {
        // Tunnel not available
      }
      return false;
    }

    async function init() {
      const found = await detectUrl();

      if (!found) {
        // No tunnel yet - set localhost as fallback and start polling
        if (typeof window !== "undefined") {
          setBaseUrl(window.location.origin);
        }

        // Poll every 2 seconds for tunnel URL
        intervalId = setInterval(detectUrl, 2000);
      }
    }

    init();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const {
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    questionEnded,
    gameCancelled,
  } = useSocket({ gameCode, role: "host" });

  // Close window when game is cancelled
  useEffect(() => {
    if (gameCancelled) {
      window.close();
    }
  }, [gameCancelled]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold text-primary">
            Connecting...
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room
  if (gameState.status === "WAITING") {
    const joinUrl = `${baseUrl}/play/${gameCode}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              {gameState.quizTitle}
            </h1>
            <p className="text-xl text-muted-foreground">
              Waiting for players to join...
            </p>
          </div>

          {/* QR Code & Code */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <Card className="p-6 bg-white">
              <QRCodeSVG value={joinUrl} size={256} level="M" />
            </Card>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Game Code</p>
              <p className="text-6xl font-mono font-bold tracking-wider text-primary">
                {gameCode}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Join at <span className="font-medium">{joinUrl}</span>
              </p>
            </div>
          </div>

          {/* Players */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Players ({gameState.players.length})
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm"
                >
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
                        className={player.avatarEmoji ? "text-2xl" : "text-white text-sm"}
                      >
                        {player.avatarEmoji || player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-medium">{player.name}</span>
                </div>
              ))}
              {gameState.players.length === 0 && (
                <p className="text-muted-foreground">
                  Waiting for players to scan the QR code...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question View
  if (gameState.status === "QUESTION" || gameState.status === "REVEALING") {
    const isRevealing = gameState.status === "REVEALING";
    const correctIds = questionEnded?.correctAnswerIds || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background p-8">
        <div className="max-w-5xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-lg px-4 py-1">
              Question {gameState.currentQuestionIndex + 1} of{" "}
              {gameState.totalQuestions}
            </Badge>
            {!isRevealing && (
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-primary">
                  {timeRemaining}
                </span>
                <span className="text-muted-foreground">seconds</span>
              </div>
            )}
          </div>

          {/* Timer Bar */}
          {!isRevealing && currentQuestion && (
            <Progress
              value={(timeRemaining / currentQuestion.timeLimit) * 100}
              className="h-2 mb-8"
            />
          )}

          {/* Question */}
          {currentQuestion && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">
                  {currentQuestion.questionText}
                </h2>
                {currentQuestion.imageUrl && (
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                )}
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.answers.map((answer, index) => {
                  const colors = [
                    "bg-red-500",
                    "bg-blue-500",
                    "bg-yellow-500",
                    "bg-green-500",
                    "bg-purple-500",
                    "bg-orange-500",
                  ];
                  const isCorrect = correctIds.includes(answer.id);
                  const answerCount =
                    questionEnded?.stats.answerDistribution[answer.id] || 0;

                  return (
                    <div
                      key={answer.id}
                      className={`
                        ${colors[index % colors.length]}
                        ${isRevealing && !isCorrect ? "opacity-50" : ""}
                        rounded-xl p-6 text-white relative overflow-hidden
                        transition-all duration-300
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-xl">{answer.answerText}</span>
                        {isRevealing && isCorrect && (
                          <Check className="w-8 h-8 ml-auto" />
                        )}
                      </div>
                      {isRevealing && (
                        <div className="mt-2 text-sm opacity-80">
                          {answerCount} player{answerCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Answer count */}
              {!isRevealing && (
                <div className="text-center text-muted-foreground">
                  {gameState.players.filter((p) => p.hasAnswered).length} of{" "}
                  {gameState.players.length} players answered
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Scoreboard
  if (gameState.status === "SCOREBOARD" || gameState.status === "FINISHED") {
    const isFinished = gameState.status === "FINISHED";
    const displayScores = scores.length > 0 ? scores : gameState.players.map((p, i) => ({
      ...p,
      playerId: p.id,
      position: i + 1,
      change: 0,
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            {isFinished ? "Final Results" : "Scoreboard"}
          </h1>

          {/* Podium for final */}
          {isFinished && displayScores.length >= 3 && (
            <div className="flex justify-center items-end gap-4 mb-12">
              {/* 2nd Place */}
              <div className="text-center">
                {displayScores[1]?.avatarEmoji?.startsWith("/") ? (
                  <img
                    src={displayScores[1].avatarEmoji}
                    alt={displayScores[1].name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarFallback
                      style={{ backgroundColor: displayScores[1]?.avatarEmoji ? "transparent" : displayScores[1]?.avatarColor }}
                      className={displayScores[1]?.avatarEmoji ? "text-4xl" : "text-white text-2xl"}
                    >
                      {displayScores[1]?.avatarEmoji || displayScores[1]?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Medal className="w-8 h-8 mx-auto text-gray-400" />
                <p className="font-bold">{displayScores[1]?.name}</p>
                <p className="text-xl font-bold text-primary">
                  {displayScores[1]?.score}
                </p>
                <div className="w-24 h-24 bg-gray-300 rounded-t-lg mt-2" />
              </div>

              {/* 1st Place */}
              <div className="text-center">
                {displayScores[0]?.avatarEmoji?.startsWith("/") ? (
                  <img
                    src={displayScores[0].avatarEmoji}
                    alt={displayScores[0].name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <Avatar className="w-20 h-20 mx-auto mb-2">
                    <AvatarFallback
                      style={{ backgroundColor: displayScores[0]?.avatarEmoji ? "transparent" : displayScores[0]?.avatarColor }}
                      className={displayScores[0]?.avatarEmoji ? "text-5xl" : "text-white text-3xl"}
                    >
                      {displayScores[0]?.avatarEmoji || displayScores[0]?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Trophy className="w-10 h-10 mx-auto text-yellow-500" />
                <p className="font-bold text-lg">{displayScores[0]?.name}</p>
                <p className="text-2xl font-bold text-primary">
                  {displayScores[0]?.score}
                </p>
                <div className="w-24 h-32 bg-yellow-400 rounded-t-lg mt-2" />
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                {displayScores[2]?.avatarEmoji?.startsWith("/") ? (
                  <img
                    src={displayScores[2].avatarEmoji}
                    alt={displayScores[2].name}
                    className="w-14 h-14 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarFallback
                      style={{ backgroundColor: displayScores[2]?.avatarEmoji ? "transparent" : displayScores[2]?.avatarColor }}
                      className={displayScores[2]?.avatarEmoji ? "text-3xl" : "text-white text-xl"}
                    >
                      {displayScores[2]?.avatarEmoji || displayScores[2]?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Award className="w-7 h-7 mx-auto text-amber-600" />
                <p className="font-bold">{displayScores[2]?.name}</p>
                <p className="text-lg font-bold text-primary">
                  {displayScores[2]?.score}
                </p>
                <div className="w-24 h-16 bg-amber-600 rounded-t-lg mt-2" />
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="space-y-2">
            {displayScores.map((player, index) => (
              <div
                key={player.playerId}
                className={`
                  flex items-center gap-4 p-4 rounded-lg
                  ${index === 0 ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-card"}
                `}
              >
                <span className="text-2xl font-bold w-8 text-center">
                  {index + 1}
                </span>
                {player.avatarEmoji?.startsWith("/") ? (
                  <img
                    src={player.avatarEmoji}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Avatar>
                    <AvatarFallback
                      style={{ backgroundColor: player.avatarEmoji ? "transparent" : player.avatarColor }}
                      className={player.avatarEmoji ? "text-2xl" : "text-white"}
                    >
                      {player.avatarEmoji || player.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="font-medium flex-1">{player.name}</span>
                {player.change !== 0 && (
                  <span
                    className={`text-sm ${
                      player.change > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {player.change > 0 ? "↑" : "↓"}
                    {Math.abs(player.change)}
                  </span>
                )}
                <span className="text-xl font-bold text-primary">
                  {player.score}
                </span>
              </div>
            ))}
          </div>

          {isFinished && (
            <p className="text-center text-muted-foreground mt-8">
              Thanks for playing!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default / Loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{gameState.quizTitle}</h1>
        <p className="text-muted-foreground mt-2">Game in progress...</p>
      </div>
    </div>
  );
}
