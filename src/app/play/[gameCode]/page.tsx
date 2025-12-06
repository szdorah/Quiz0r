"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useQuizPreloader } from "@/hooks/useQuizPreloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Trophy, Medal, Award, Loader2, Upload, Layers, Bell, UserX } from "lucide-react";
import { ThemeProvider, getAnswerColor, getSelectedAnswerStyle } from "@/components/theme/ThemeProvider";
import { BackgroundEffects } from "@/components/theme/BackgroundEffects";
import { BORDER_RADIUS_MAP, SHADOW_MAP } from "@/types/theme";
import { getContrastingTextColor } from "@/lib/color-utils";

export default function PlayerGamePage({
  params,
}: {
  params: { gameCode: string };
}) {
  const { gameCode } = params;
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [gameStatus, setGameStatus] = useState<"loading" | "valid" | "not_found" | "ended">("loading");
  const [joinTheme, setJoinTheme] = useState<any>(null);

  // Check if game exists and is joinable on mount
  useEffect(() => {
    async function checkGame() {
      try {
        const res = await fetch(`/api/games/${gameCode}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (res.ok) {
          const data = await res.json();
          setJoinTheme(data.quizTheme);
          if (data.status === "WAITING") {
            setGameStatus("valid");
          } else if (data.status === "FINISHED") {
            setGameStatus("ended");
          } else {
            // Game is in progress (ACTIVE, QUESTION, REVEALING, SCOREBOARD)
            setGameStatus("ended");
          }
        } else if (res.status === 404) {
          setGameStatus("not_found");
        } else {
          setGameStatus("not_found");
        }
      } catch {
        setGameStatus("not_found");
      }
    }
    checkGame();
  }, [gameCode]);

  // Common emojis for avatar selection
  const avatarEmojis = [
    "😀", "😎", "🤓", "😈", "👻", "🤖", "👽", "🦊",
    "🐱", "🐶", "🐸", "🦁", "🐼", "🐨", "🦄", "🐲",
    "🌟", "⚡", "🔥", "💎", "🎮", "🎸", "🚀", "🏆",
  ];

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setJoinError("Invalid file type. Use JPEG, PNG, GIF, or WebP");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setJoinError("Image too large. Maximum size is 5MB");
      return;
    }

    setUploadingImage(true);
    setJoinError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarImage(data.url);
        setSelectedEmoji(null); // Clear emoji when image is selected
      } else {
        const data = await res.json();
        setJoinError(data.error || "Failed to upload image");
      }
    } catch {
      setJoinError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  const {
    socket,
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    answerResult,
    questionEnded,
    error,
    gameCancelled,
    playerRemoved,
    removalReason,
    admissionStatus,
    submitAnswer,
  } = useSocket({
    gameCode,
    role: "player",
    playerName: joined ? playerName : undefined,
  });

  // Get player ID from game state
  const playerId = gameState?.players.find(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  )?.id;

  // Initialize quiz preloader
  const { quizData } = useQuizPreloader({
    gameCode,
    playerId,
    socket,
  });

  // Use preloaded question if available, otherwise fall back to socket-provided question
  const effectiveCurrentQuestion = useMemo(() => {
    if (quizData && gameState?.currentQuestionIndex !== undefined) {
      // Use preloaded question data
      return quizData.questions[gameState.currentQuestionIndex];
    }
    // Fall back to socket-provided question
    return currentQuestion;
  }, [quizData, gameState?.currentQuestionIndex, currentQuestion]);

  // Reset selected answers when question changes
  useEffect(() => {
    setSelectedAnswers(new Set());
    setHasSubmitted(false);
  }, [effectiveCurrentQuestion?.id]);

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
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ name, avatarEmoji: avatarImage || selectedEmoji }),
      });

      if (res.ok) {
        setJoined(true);
      } else {
        const data = await res.json();
        // If admission is pending, still proceed to join (socket will handle waiting state)
        if (data.status === "pending") {
          setJoined(true);
        } else {
          setJoinError(data.error || "Failed to join game");
        }
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

    if (effectiveCurrentQuestion?.questionType === "SINGLE_SELECT") {
      // Single select - replace selection
      newSelected.clear();
      newSelected.add(answerId);
      // Auto-submit for single select
      submitAnswer(effectiveCurrentQuestion.id, [answerId]);
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
    if (!effectiveCurrentQuestion || hasSubmitted || selectedAnswers.size === 0) return;
    submitAnswer(effectiveCurrentQuestion.id, Array.from(selectedAnswers));
    setHasSubmitted(true);
  }

  // Player waiting for admission (pending status)
  if (joined && gameState && !gameState.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    const theme = gameState?.quizTheme || joinTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2 border-yellow-500">
            <CardContent className="pt-6 text-center">
              <Bell className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <p className="text-lg font-bold mb-2">Waiting for Admission</p>
              <p className="text-muted-foreground">
                {playerRemoved
                  ? "You were removed from this game. Your request to rejoin is pending host approval."
                  : "Your request to join is pending host approval."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="animate-pulse flex gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animation-delay-200"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animation-delay-400"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Admission refused
  if (admissionStatus === "refused") {
    const theme = gameState?.quizTheme || joinTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2 border-destructive">
            <CardContent className="pt-6 text-center">
              <UserX className="w-12 h-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-bold text-destructive mb-2">Admission Refused</p>
              <p className="text-muted-foreground">
                The host has refused your request to join this game. Please contact the game host.
              </p>
              <Button
                onClick={() => router.push("/play")}
                className="mt-6"
                variant="outline"
              >
                Join Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Player removed (initial removal screen)
  if (playerRemoved && admissionStatus !== "admitted") {
    const theme = gameState?.quizTheme || joinTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2 border-destructive">
            <CardContent className="pt-6 text-center">
              <X className="w-12 h-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-bold text-destructive mb-2">Removed from Game</p>
              <p className="text-muted-foreground">
                {removalReason || "You have been removed from the game. Please contact the game host."}
              </p>
              <Button
                onClick={() => router.push("/play")}
                className="mt-6"
                variant="outline"
              >
                Join Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Game cancelled state
  if (gameCancelled) {
    const theme = gameState?.quizTheme || joinTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6 text-center">
              <X className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Game Cancelled</p>
              <p className="text-muted-foreground mt-2">The host has cancelled this game.</p>
              <Button onClick={() => router.push("/play")} className="mt-4">
                Join Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemeProvider theme={joinTheme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: joinTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={joinTheme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6 text-center">
              <X className="w-12 h-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
              <Button onClick={() => router.push("/play")} className="mt-4">
                Try Another Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Loading state while checking game
  if (!joined && gameStatus === "loading") {
    return (
      <ThemeProvider theme={joinTheme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: joinTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={joinTheme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Checking game...</p>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Game not found
  if (!joined && gameStatus === "not_found") {
    return (
      <ThemeProvider theme={joinTheme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: joinTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={joinTheme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6 text-center">
              <X className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Game Not Found</p>
              <p className="text-muted-foreground mt-2">
                This game code doesn&apos;t exist. Please check the code and try again.
              </p>
              <Button onClick={() => router.push("/play")} className="mt-4">
                Enter Different Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Game has ended or is in progress
  if (!joined && gameStatus === "ended") {
    return (
      <ThemeProvider theme={joinTheme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: joinTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={joinTheme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6 text-center">
              <X className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Game Has Ended</p>
              <p className="text-muted-foreground mt-2">
                This game is no longer accepting new players.
              </p>
              <Button onClick={() => router.push("/play")} className="mt-4">
                Join Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  // Not joined yet - show name entry (only if game is valid)
  if (!joined) {
    return (
      <ThemeProvider theme={joinTheme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: joinTheme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={joinTheme} />
          <Card className="w-full max-w-sm relative z-10 shadow-2xl border-2">
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose Your Avatar</label>

                  {/* Avatar Preview */}
                  {(avatarImage || selectedEmoji) && (
                    <div className="flex justify-center mb-2">
                      <div className="relative">
                        {avatarImage ? (
                          <img
                            src={avatarImage}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl ring-2 ring-primary">
                            {selectedEmoji}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarImage(null);
                            setSelectedEmoji(null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs hover:bg-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Image Button */}
                  <div className="flex justify-center mb-2">
                    <label
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                        border-2 border-dashed border-muted-foreground/30 hover:border-primary
                        transition-colors
                        ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}
                        ${avatarImage ? "bg-primary/10 border-primary" : ""}
                      `}
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {uploadingImage ? "Uploading..." : avatarImage ? "Change Image" : "Upload Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={joining || uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-center text-muted-foreground mb-2">or pick an emoji</p>

                  <div className="grid grid-cols-8 gap-2">
                    {avatarEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(selectedEmoji === emoji ? null : emoji);
                          setAvatarImage(null); // Clear image when emoji is selected
                        }}
                        disabled={joining}
                        className={`
                          text-2xl p-2 rounded-lg transition-all
                          ${selectedEmoji === emoji && !avatarImage
                            ? "bg-primary/20 ring-2 ring-primary scale-110"
                            : "hover:bg-muted"
                          }
                        `}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {joinError && (
                  <p className="text-sm text-destructive text-center">
                    {joinError}
                  </p>
                )}
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
      </ThemeProvider>
    );
  }

  // Connecting
  if (!connected || !gameState) {
    const theme = joinTheme;
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Connecting to game...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Waiting for game to start
  if (gameState.status === "WAITING") {
    const playerAvatar = avatarImage || selectedEmoji;
    const theme = gameState.quizTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <Card className="w-full max-w-sm text-center relative z-10 shadow-2xl border-2">
            <CardContent className="pt-6">
              {playerAvatar ? (
                playerAvatar.startsWith("/") ? (
                  <img
                    src={playerAvatar}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-4 ring-2 ring-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-4xl">
                    {playerAvatar}
                  </div>
                )
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
              )}
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
      </ThemeProvider>
    );
  }

  // Section view - players just see the section slide
  if (gameState.status === "SECTION" && effectiveCurrentQuestion) {
    const theme = gameState.quizTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            background: theme?.gradients?.sectionSlide || 'linear-gradient(135deg, hsl(0 0% 35%) 0%, hsl(0 0% 25%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          <div className="text-center text-white relative z-10 px-4 max-w-2xl mx-auto">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h1 className="text-3xl font-bold mb-4">
              {effectiveCurrentQuestion.questionText}
            </h1>
            {effectiveCurrentQuestion.hostNotes && (
              <p className="text-lg opacity-90 mb-6">
                {effectiveCurrentQuestion.hostNotes}
              </p>
            )}
            {effectiveCurrentQuestion.imageUrl && (
              <img
                src={effectiveCurrentQuestion.imageUrl}
                alt="Section"
                className="max-h-48 mx-auto rounded-xl shadow-lg mb-6"
              />
            )}
            <p className="text-sm opacity-70">
              Waiting for host to continue...
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Question view
  if (
    gameState.status === "QUESTION" ||
    (gameState.status === "REVEALING" && effectiveCurrentQuestion)
  ) {
    const isRevealing = gameState.status === "REVEALING";
    const correctIds = questionEnded?.correctAnswerIds || [];
    const theme = gameState.quizTheme;

    return (
      <ThemeProvider theme={theme}>
        <BackgroundEffects theme={theme} />
        <div
          className="min-h-screen flex flex-col overflow-x-hidden"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          {/* Timer */}
          {!isRevealing && effectiveCurrentQuestion && (
            <div className="px-8 py-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Question {gameState.currentQuestionIndex + 1}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {timeRemaining}s
                </span>
              </div>
              <Progress
                value={(timeRemaining / effectiveCurrentQuestion.timeLimit) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Question */}
          <div className="px-8 py-4">
            <h2 className="text-xl font-bold text-center mb-2">
              {effectiveCurrentQuestion?.questionText}
            </h2>
            {effectiveCurrentQuestion?.imageUrl && (
              <img
                src={effectiveCurrentQuestion.imageUrl}
                alt="Question"
                className="max-h-32 mx-auto rounded-lg mb-4"
              />
            )}
            {effectiveCurrentQuestion?.questionType === "MULTI_SELECT" && !hasSubmitted && (
              <p className="text-sm text-center text-muted-foreground mb-2">
                Select all that apply
              </p>
            )}
          </div>

          {/* Answer Result (shown during revealing) */}
          {isRevealing && answerResult && (
            <div
              className={`mx-8 p-4 rounded-lg text-center mb-4 ${
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
          <div className="flex-1 px-8 py-4 space-y-4">
            {effectiveCurrentQuestion?.answers.map((answer, index) => {
              const isSelected = selectedAnswers.has(answer.id);
              const isCorrect = correctIds.includes(answer.id);
              const wasSelected = isSelected;

              // Determine background color and styling
              let background: string;
              let textColor: string;
              let additionalStyles: React.CSSProperties = {};

              // Get the base answer color (hex) for text color calculation
              const answerColorHex = getAnswerColor(gameState.quizTheme, index);

              // Apply theme border radius and shadow
              const borderRadius = gameState.quizTheme?.effects?.borderRadius
                ? BORDER_RADIUS_MAP[gameState.quizTheme.effects.borderRadius]
                : BORDER_RADIUS_MAP.lg;
              const boxShadow = gameState.quizTheme?.effects?.shadow
                ? SHADOW_MAP[gameState.quizTheme.effects.shadow]
                : SHADOW_MAP.md;

              additionalStyles.borderRadius = borderRadius;
              additionalStyles.boxShadow = boxShadow;
              additionalStyles.transformOrigin = 'center';
              additionalStyles.willChange = 'transform';

              if (isRevealing) {
                if (isCorrect) {
                  background = gameState.quizTheme?.gradients?.correctAnswer || "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
                  additionalStyles.boxShadow = `0 0 0 4px rgba(34, 197, 94, 0.3), ${boxShadow}`;
                  textColor = "0 0% 100%"; // White text on green gradient
                } else if (wasSelected && !isCorrect) {
                  background = gameState.quizTheme?.gradients?.wrongAnswer || "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                  additionalStyles.opacity = 0.5;
                  textColor = "0 0% 100%"; // White text on red gradient
                } else {
                  background = "#9ca3af"; // gray-400
                  additionalStyles.opacity = 0.5;
                  textColor = "0 0% 100%"; // White text on gray
                }
              } else if (hasSubmitted) {
                if (isSelected) {
                  background = answerColorHex;
                  const selectedStyle = getSelectedAnswerStyle(gameState.quizTheme, true);
                  Object.assign(additionalStyles, selectedStyle);
                  textColor = getContrastingTextColor(answerColorHex);
                } else {
                  background = "#9ca3af"; // gray-400
                  additionalStyles.opacity = 0.5;
                  textColor = "0 0% 100%"; // White text on gray
                }
              } else if (isSelected) {
                background = answerColorHex;
                const selectedStyle = getSelectedAnswerStyle(gameState.quizTheme, true);
                Object.assign(additionalStyles, selectedStyle);
                textColor = getContrastingTextColor(answerColorHex);
              } else {
                background = answerColorHex;
                textColor = getContrastingTextColor(answerColorHex);
              }

              return (
                <div key={answer.id} className="px-1">
                  <button
                    onClick={() => toggleAnswer(answer.id)}
                    disabled={hasSubmitted || isRevealing}
                    className={`
                      w-full p-4 text-lg font-medium
                      transition-all duration-200 flex items-center gap-3
                      ${!hasSubmitted && !isRevealing ? "active:scale-95" : ""}
                    `}
                  style={{
                    background,
                    maxWidth: '100%',
                    color: `hsl(${textColor})`,
                    ...additionalStyles,
                  }}
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
                </div>
              );
            })}
          </div>

          {/* Submit button for multi-select */}
          {effectiveCurrentQuestion?.questionType === "MULTI_SELECT" &&
            !hasSubmitted &&
            !isRevealing && (
              <div className="px-8 py-4 border-t">
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
            <div className="px-8 py-4 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Waiting for time to expire...
            </div>
          )}
        </div>
      </ThemeProvider>
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

    const theme = gameState.quizTheme;
    return (
      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen p-4 relative"
          style={{
            background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
          }}
        >
          <BackgroundEffects theme={theme} />
          {/* My Position */}
          <Card className="mb-6 relative z-10 shadow-xl border-2">
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
          <h2 className="text-lg font-bold mb-3 relative z-10">
            {isFinished ? "Final Results" : "Leaderboard"}
          </h2>
          <div className="space-y-2 relative z-10">
            {displayScores.slice(0, 10).map((player, index) => {
              const isMe =
                player.name.toLowerCase() === playerName.toLowerCase();
              return (
                <div
                  key={player.playerId}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg shadow-lg
                    ${isMe ? "bg-primary/10 ring-2 ring-primary" : "bg-card"}
                  `}
                >
                  <span className="font-bold w-6 text-center">{index + 1}</span>
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
      </ThemeProvider>
    );
  }

  // Default loading state
  const theme = gameState?.quizTheme || joinTheme;
  return (
    <ThemeProvider theme={theme}>
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          background: theme?.gradients?.pageBackground || 'linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)',
        }}
      >
        <BackgroundEffects theme={theme} />
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    </ThemeProvider>
  );
}
