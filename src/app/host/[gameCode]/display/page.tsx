"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSocket } from "@/hooks/useSocket";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Trophy, Medal, Award, Layers, Loader2, AlarmClock } from "lucide-react";
import { ThemeProvider, getAnswerColor } from "@/components/theme/ThemeProvider";
import { BackgroundEffects } from "@/components/theme/BackgroundEffects";
import { AspectRatioHelper } from "@/components/display/AspectRatioHelper";
import { BORDER_RADIUS_MAP, SHADOW_MAP } from "@/types/theme";
import { getContrastingTextColor } from "@/lib/color-utils";
import { SupportedLanguages } from "@/types";

export default function HostDisplayPage({
  params,
}: {
  params: { gameCode: string };
}) {
  const { gameCode } = params;
  const [baseUrl, setBaseUrl] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [urlReady, setUrlReady] = useState(false);

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

  // Attempt to shorten URL when baseUrl changes
  useEffect(() => {
    if (!baseUrl) return;

    let timeoutId: NodeJS.Timeout;

    async function attemptShorten() {
      const fullUrl = `${baseUrl}/play/${gameCode}`;

      try {
        const res = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl, gameCode }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.shortUrl) {
            setShortUrl(data.shortUrl);
          }
        }
      } catch (error) {
        console.error("Failed to shorten URL:", error);
        // Fallback to full URL (shortUrl remains null)
      } finally {
        setUrlReady(true);
      }
    }

    // Set a timeout to show URL even if shortening takes too long
    timeoutId = setTimeout(() => {
      setUrlReady(true);
    }, 3000);

    attemptShorten();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [baseUrl, gameCode]);

  const {
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    questionEnded,
    awaitingReveal,
    gameCancelled,
  } = useSocket({ gameCode, role: "host" });

  // Close window when game is cancelled
  useEffect(() => {
    if (gameCancelled) {
      window.close();
    }
  }, [gameCancelled]);

  // For loading states, we need to fetch theme first
  const [loadingTheme, setLoadingTheme] = useState<any>(null);
  const [themeFetched, setThemeFetched] = useState(false);

  useEffect(() => {
    async function fetchTheme() {
      try {
        const res = await fetch(`/api/games/${gameCode}`);
        if (res.ok) {
          const data = await res.json();
          setLoadingTheme(data.quizTheme);
        }
      } catch {
        // Theme fetch failed, will use default
      } finally {
        setThemeFetched(true);
      }
    }

    if (!connected || !gameState) {
      fetchTheme();
    }
  }, [connected, gameState, gameCode]);

  if (!connected) {
    return (
      <ThemeProvider theme={loadingTheme}>
        <div
          className="min-h-screen flex items-center justify-center relative"
          style={{
            background: loadingTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={loadingTheme} />
          <div className="text-center relative z-10">
            <div className="animate-pulse text-2xl font-bold text-primary">
              Connecting...
            </div>
          </div>
        </div>
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  if (!gameState) {
    return (
      <ThemeProvider theme={loadingTheme}>
        <div
          className="min-h-screen flex items-center justify-center relative"
          style={{
            background: loadingTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={loadingTheme} />
          <div className="text-center relative z-10">
            <div className="text-2xl font-bold text-muted-foreground">
              Loading game...
            </div>
          </div>
        </div>
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  // Waiting Room
  if (gameState.status === "WAITING") {
    const fullUrl = `${baseUrl}/play/${gameCode}`;
    // Use short URL if available, otherwise fallback to full URL
    const joinUrl = shortUrl || fullUrl;
    const theme = gameState.quizTheme;

    // Don't show URL/QR code until we've attempted to get short URL
    const showJoinInfo = urlReady && baseUrl;

    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen p-8 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <div className="max-w-4xl mx-auto relative z-10 px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2">
                {gameState.quizTitle}
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                Waiting for players to join...
              </p>
            </div>

            {/* QR Code & Code */}
            {showJoinInfo ? (
              <div className="flex flex-col items-center gap-6 mb-12">
                <Card className="p-4 md:p-6 bg-white">
                  <QRCodeSVG
                    value={joinUrl}
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 256}
                    level="M"
                    className="w-full h-auto max-w-[256px]"
                  />
                </Card>
                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground mb-2">Game Code</p>
                  <p className="text-4xl md:text-5xl lg:text-6xl font-mono font-bold tracking-wider text-primary break-all">
                    {gameCode}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2 break-all">
                    Join at <span className="font-medium">{joinUrl}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            )}

            {/* Players */}
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">
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
                        <span className="font-medium flex items-center gap-1.5">
                          {player.name}
                        </span>
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
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  // Section View
  if (gameState.status === "SECTION" && currentQuestion) {
    const theme = gameState.quizTheme;

    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-8 relative"
          style={{
            background: theme?.gradients?.sectionSlide || 'linear-gradient(135deg, hsl(0 0% 35%) 0%, hsl(0 0% 25%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <div className="max-w-4xl mx-auto text-center text-white relative z-10 px-4">
            <div className="mb-8">
              <Layers className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-80" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {currentQuestion.questionText}
            </h1>
            {currentQuestion.hostNotes && (
              <p className="text-lg md:text-xl lg:text-2xl opacity-90 mb-8">
                {currentQuestion.hostNotes}
              </p>
            )}
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Section"
                className="max-h-80 mx-auto rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  // Question View
  if (gameState.status === "QUESTION" || gameState.status === "REVEALING") {
    const isRevealing = gameState.status === "REVEALING";
    const correctIds = questionEnded?.correctAnswerIds || [];
    const theme = gameState.quizTheme;

    if (isRevealing && awaitingReveal) {
      return (
        <ThemeProvider theme={theme}>
          <BackgroundEffects theme={theme} />
          <div
            className="min-h-screen flex flex-col items-center justify-center text-center px-6"
            style={{
              background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
            }}
          >
            <div className="flex flex-col items-center gap-4 text-amber-200">
              <AlarmClock className="w-14 h-14 animate-bounce" />
              <h2 className="text-4xl font-bold text-white">Time&apos;s up!</h2>
              <p className="text-lg text-amber-100/80 max-w-xl">
                The host will reveal the answers shortly.
              </p>
            </div>
          </div>
          <AspectRatioHelper />
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen p-8 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <div className="max-w-5xl mx-auto relative z-10 px-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm md:text-base lg:text-lg px-3 md:px-4 py-1">
                Question {gameState.currentQuestionIndex + 1} of{" "}
                {gameState.totalQuestions}
              </Badge>
              {!isRevealing && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                    {timeRemaining}
                  </span>
                  <span className="text-sm md:text-base text-muted-foreground">seconds</span>
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
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {currentQuestion.answers.map((answer, index) => {
                    const isCorrect = correctIds.includes(answer.id);
                    const answerCount =
                      questionEnded?.stats.answerDistribution[answer.id] || 0;

                    const borderRadius = gameState.quizTheme?.effects?.borderRadius
                      ? BORDER_RADIUS_MAP[gameState.quizTheme.effects.borderRadius]
                      : BORDER_RADIUS_MAP.lg;
                    const boxShadow = gameState.quizTheme?.effects?.shadow
                      ? SHADOW_MAP[gameState.quizTheme.effects.shadow]
                      : SHADOW_MAP.md;

                    const answerColorHex = getAnswerColor(gameState.quizTheme, index);
                    const textColor = getContrastingTextColor(answerColorHex);

                    return (
                      <div
                        key={answer.id}
                        className={`
                          ${isRevealing && !isCorrect ? "opacity-50" : ""}
                          p-4 md:p-5 lg:p-6 relative overflow-hidden
                          transition-all duration-300
                        `}
                        style={{
                          backgroundColor: answerColorHex,
                          color: `hsl(${textColor})`,
                          borderRadius,
                          boxShadow,
                        }}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-lg md:text-xl lg:text-2xl font-bold shrink-0">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-base md:text-lg lg:text-xl">{answer.answerText}</span>
                          {isRevealing && isCorrect && (
                            <Check className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 ml-auto shrink-0" />
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
                {!isRevealing && (() => {
                  const activeAdmitted = gameState.players.filter(
                    (p) => p.isActive && p.admissionStatus === "admitted"
                  );
                  const answeredCount = activeAdmitted.filter((p) => p.hasAnswered).length;
                  return (
                    <div className="text-center text-muted-foreground">
                      {answeredCount} of {activeAdmitted.length} players answered
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  // Scoreboard
  if (gameState.status === "SCOREBOARD" || gameState.status === "FINISHED") {
    const isFinished = gameState.status === "FINISHED";
    const theme = gameState.quizTheme;
    const displayScores = scores.length > 0 ? scores : gameState.players.map((p, i) => ({
      ...p,
      playerId: p.id,
      position: i + 1,
      change: 0,
    }));

    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen p-8 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <div className="max-w-3xl mx-auto relative z-10 px-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8">
              {isFinished ? "Final Results" : "Scoreboard"}
            </h1>

            {/* Podium for final */}
            {isFinished && displayScores.length >= 3 && (
              <div className="flex justify-center items-end gap-2 md:gap-4 mb-12">
                {/* 2nd Place */}
                <div className="text-center scale-75 md:scale-90 lg:scale-100">
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
                  <p className="font-bold text-sm">{displayScores[1]?.name}</p>
                  <p className="text-xl font-bold text-primary">
                    {displayScores[1]?.score}
                  </p>
                  <div className="w-24 h-24 bg-gray-300 rounded-t-lg mt-2" />
                </div>

                {/* 1st Place */}
                <div className="text-center scale-75 md:scale-90 lg:scale-100">
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
                  <p className="font-bold text-base">{displayScores[0]?.name}</p>
                  <p className="text-2xl font-bold text-primary">
                    {displayScores[0]?.score}
                  </p>
                  <div className="w-24 h-32 bg-yellow-400 rounded-t-lg mt-2" />
                </div>

                {/* 3rd Place */}
                <div className="text-center scale-75 md:scale-90 lg:scale-100">
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
                  <p className="font-bold text-sm">{displayScores[2]?.name}</p>
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
                    flex items-center gap-4 p-4 rounded-lg bg-card
                    ${index === 0 ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20" : ""}
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
                  <span className="font-medium flex-1 flex items-center gap-1.5">
                    {player.name}
                    {player.languageCode && player.languageCode !== "en" && (
                      <span
                        className="text-sm"
                        title={SupportedLanguages[player.languageCode]?.nativeName || player.languageCode}
                      >
                        {SupportedLanguages[player.languageCode]?.flag || ""}
                      </span>
                    )}
                  </span>

                  {/* Power-up indicators */}
                  {"powerUpsUsed" in player && player.powerUpsUsed && player.powerUpsUsed.length > 0 && (
                    <div className="flex gap-1">
                      {player.powerUpsUsed.map((usage, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-1.5 py-0.5 bg-muted rounded"
                          title={`Q${usage.questionNumber}: ${usage.powerUpType}`}
                        >
                          {usage.powerUpType === "hint" && "💡"}
                          {usage.powerUpType === "copy" && "👥"}
                          {usage.powerUpType === "double" && "⚡"}
                        </span>
                      ))}
                    </div>
                  )}

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
        <AspectRatioHelper />
      </ThemeProvider>
    );
  }

  // Default / Loading state
  const theme = gameState.quizTheme;
  return (
    <ThemeProvider theme={theme}>
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
        }}
      >
        <BackgroundEffects theme={theme} />
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold">{gameState.quizTitle}</h1>
          <p className="text-muted-foreground mt-2">Game in progress...</p>
        </div>
      </div>
      <AspectRatioHelper />
    </ThemeProvider>
  );
}
