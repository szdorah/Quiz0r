import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import {
  GameState,
  PlayerInfo,
  QuestionData,
  PlayerScore,
  GameStatus,
  PlayerAnswerDetail,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types";
import { QuizTheme } from "@/types/theme";
import {
  calculateSingleSelectScore,
  calculateMultiSelectScore,
  isFullyCorrect,
  generateAvatarColor,
} from "@/lib/scoring";
import { parseTheme } from "@/lib/theme";

const prisma = new PrismaClient();

interface ActiveGame {
  gameCode: string;
  quizId: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  timerInterval: NodeJS.Timeout | null;
  questions: QuestionData[];
  correctAnswerIds: Map<string, string[]>; // questionId -> correctAnswerIds
  playerAnswers: Map<string, Set<string>>; // questionId -> Set of playerIds who answered
  previousPositions: Map<string, number>; // playerId -> previous position
}

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export class GameManager {
  private io: TypedServer;
  private activeGames: Map<string, ActiveGame> = new Map();

  constructor(io: TypedServer) {
    this.io = io;
  }

  handleConnection(socket: TypedSocket) {
    console.log(`Client connected: ${socket.id}`);

    // Host events
    socket.on("host:joinRoom", (data) => this.handleHostJoin(socket, data));
    socket.on("host:startGame", (data) => this.handleStartGame(socket, data));
    socket.on("host:nextQuestion", (data) => this.handleNextQuestion(socket, data));
    socket.on("host:showScoreboard", (data) => this.handleShowScoreboard(socket, data));
    socket.on("host:endGame", (data) => this.handleEndGame(socket, data));
    socket.on("host:skipTimer", (data) => this.handleSkipTimer(socket, data));
    socket.on("host:cancelGame", (data) => this.handleCancelGame(socket, data));

    // Player events
    socket.on("player:join", (data) => this.handlePlayerJoin(socket, data));
    socket.on("player:answer", (data) => this.handlePlayerAnswer(socket, data));

    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  private async handleHostJoin(socket: TypedSocket, data: { gameCode: string }) {
    const { gameCode } = data;
    const upperCode = gameCode.toUpperCase();

    socket.join(`game:${upperCode}`);
    socket.join(`game:${upperCode}:host`);

    // Send current game state
    const state = await this.getGameState(upperCode);
    if (state) {
      socket.emit("game:state", state);
    }
  }

  private async handlePlayerJoin(
    socket: TypedSocket,
    data: { gameCode: string; name: string }
  ) {
    const { gameCode, name } = data;
    const upperCode = gameCode.toUpperCase();

    try {
      // Find game session
      const gameSession = await prisma.gameSession.findUnique({
        where: { gameCode: upperCode },
      });

      if (!gameSession) {
        socket.emit("error", { message: "Game not found", code: "GAME_NOT_FOUND" });
        return;
      }

      if (gameSession.status !== "WAITING") {
        socket.emit("error", {
          message: "Game has already started",
          code: "GAME_STARTED",
        });
        return;
      }

      // Check if player already exists
      let player = await prisma.player.findUnique({
        where: {
          gameSessionId_name: {
            gameSessionId: gameSession.id,
            name: name.trim(),
          },
        },
      });

      if (player) {
        // Update socket ID
        player = await prisma.player.update({
          where: { id: player.id },
          data: { socketId: socket.id, isActive: true },
        });
      } else {
        // Create new player
        player = await prisma.player.create({
          data: {
            gameSessionId: gameSession.id,
            name: name.trim(),
            socketId: socket.id,
            avatarColor: generateAvatarColor(),
          },
        });
      }

      // Join rooms
      socket.join(`game:${upperCode}`);
      socket.join(`game:${upperCode}:players`);

      // Store player ID on socket for disconnect handling
      (socket as unknown as { playerId: string }).playerId = player.id;
      (socket as unknown as { gameCode: string }).gameCode = upperCode;

      // Notify all clients
      const playerInfo: PlayerInfo = {
        id: player.id,
        name: player.name,
        avatarColor: player.avatarColor || "#8A2CF6",
        avatarEmoji: player.avatarEmoji,
        score: player.totalScore,
        isActive: true,
      };

      this.io.to(`game:${upperCode}`).emit("game:playerJoined", { player: playerInfo });

      // Send game state to the player
      const state = await this.getGameState(upperCode);
      if (state) {
        socket.emit("game:state", state);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      socket.emit("error", { message: "Failed to join game", code: "JOIN_FAILED" });
    }
  }

  private async handleStartGame(socket: TypedSocket, data: { gameCode: string }) {
    const { gameCode } = data;
    const upperCode = gameCode.toUpperCase();

    try {
      // Load quiz with questions
      const gameSession = await prisma.gameSession.findUnique({
        where: { gameCode: upperCode },
        include: {
          quiz: {
            include: {
              questions: {
                include: { answers: { orderBy: { orderIndex: "asc" } } },
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });

      if (!gameSession) {
        socket.emit("error", { message: "Game not found", code: "GAME_NOT_FOUND" });
        return;
      }

      // Initialize active game
      const questions: QuestionData[] = gameSession.quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        hostNotes: q.hostNotes,
        questionType: q.questionType as "SINGLE_SELECT" | "MULTI_SELECT",
        timeLimit: q.timeLimit,
        points: q.points,
        answers: q.answers.map((a) => ({
          id: a.id,
          answerText: a.answerText,
          imageUrl: a.imageUrl,
        })),
      }));

      const correctAnswerIds = new Map<string, string[]>();
      for (const q of gameSession.quiz.questions) {
        correctAnswerIds.set(
          q.id,
          q.answers.filter((a) => a.isCorrect).map((a) => a.id)
        );
      }

      this.activeGames.set(upperCode, {
        gameCode: upperCode,
        quizId: gameSession.quizId,
        status: "ACTIVE",
        currentQuestionIndex: -1,
        questionStartedAt: null,
        timerInterval: null,
        questions,
        correctAnswerIds,
        playerAnswers: new Map(),
        previousPositions: new Map(),
      });

      // Update database
      await prisma.gameSession.update({
        where: { gameCode: upperCode },
        data: { status: "ACTIVE" },
      });

      // Start first question
      await this.startNextQuestion(upperCode);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("error", { message: "Failed to start game", code: "START_FAILED" });
    }
  }

  private async handleNextQuestion(socket: TypedSocket, data: { gameCode: string }) {
    await this.startNextQuestion(data.gameCode.toUpperCase());
  }

  private async handleSkipTimer(socket: TypedSocket, data: { gameCode: string }) {
    const upperCode = data.gameCode.toUpperCase();
    const game = this.activeGames.get(upperCode);
    if (!game || game.status !== "QUESTION") return;

    // End the current question immediately
    await this.endQuestion(upperCode);
  }

  private async startNextQuestion(gameCode: string) {
    const game = this.activeGames.get(gameCode);
    if (!game) return;

    // Clear any existing timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    game.currentQuestionIndex++;

    // Check if quiz is complete
    if (game.currentQuestionIndex >= game.questions.length) {
      await this.endGame(gameCode);
      return;
    }

    const question = game.questions[game.currentQuestionIndex];
    const isSection = question.questionType === "SECTION";

    // For sections, use a special status; for questions, use QUESTION
    game.status = isSection ? "SECTION" : "QUESTION";
    game.questionStartedAt = isSection ? null : Date.now();

    if (!isSection) {
      game.playerAnswers.set(question.id, new Set());
    }

    // Update database
    await prisma.gameSession.update({
      where: { gameCode },
      data: {
        status: isSection ? "SECTION" : "QUESTION",
        currentQuestionIndex: game.currentQuestionIndex,
        questionStartedAt: isSection ? null : new Date(),
      },
    });

    // Calculate question number (excluding sections)
    const questionNumber = game.questions
      .slice(0, game.currentQuestionIndex + 1)
      .filter((q) => q.questionType !== "SECTION").length;

    // Send question/section to all clients
    this.io.to(`game:${gameCode}`).emit("game:questionStart", {
      question,
      questionIndex: game.currentQuestionIndex,
      questionNumber,
      startTime: game.questionStartedAt,
    });

    // Only start timer for actual questions, not sections
    if (!isSection) {
      let remaining = question.timeLimit;
      game.timerInterval = setInterval(() => {
        remaining--;
        this.io.to(`game:${gameCode}`).emit("game:timerTick", { remaining });

        if (remaining <= 0) {
          this.endQuestion(gameCode);
        }
      }, 1000);
    }
    // For sections, host will manually call nextQuestion to advance
  }

  private async handlePlayerAnswer(
    socket: TypedSocket,
    data: { gameCode: string; questionId: string; answerIds: string[] }
  ) {
    const { gameCode, questionId, answerIds } = data;
    const upperCode = gameCode.toUpperCase();
    const game = this.activeGames.get(upperCode);

    if (!game || game.status !== "QUESTION") return;

    const playerId = (socket as unknown as { playerId: string }).playerId;
    if (!playerId) return;

    // Check if already answered
    const answeredPlayers = game.playerAnswers.get(questionId);
    if (!answeredPlayers || answeredPlayers.has(playerId)) return;

    answeredPlayers.add(playerId);

    const question = game.questions[game.currentQuestionIndex];
    const correctIds = game.correctAnswerIds.get(questionId) || [];
    const timeTaken = Date.now() - (game.questionStartedAt || 0);

    // Calculate score
    let points = 0;
    let isCorrect = false;

    if (question.questionType === "SINGLE_SELECT") {
      isCorrect = answerIds.length === 1 && correctIds.includes(answerIds[0]);
      points = calculateSingleSelectScore(
        question.points,
        question.timeLimit * 1000,
        timeTaken,
        isCorrect
      );
    } else {
      isCorrect = isFullyCorrect(answerIds, correctIds);
      points = calculateMultiSelectScore(
        question.points,
        question.timeLimit * 1000,
        timeTaken,
        answerIds,
        correctIds
      );
    }

    // Save answer to database
    try {
      await prisma.playerAnswer.create({
        data: {
          playerId,
          questionId,
          selectedAnswerIds: JSON.stringify(answerIds),
          isCorrect,
          timeToAnswer: timeTaken,
          pointsEarned: points,
        },
      });

      // Update player's total score
      await prisma.player.update({
        where: { id: playerId },
        data: { totalScore: { increment: points } },
      });

      // Notify player of result
      const scores = await this.getPlayerScores(upperCode);
      const position = scores.findIndex((s) => s.playerId === playerId) + 1;

      socket.emit("player:answerResult", {
        correct: isCorrect,
        points,
        position,
      });

      // Notify all clients that someone answered (anonymized)
      this.io.to(`game:${upperCode}`).emit("game:answerReceived", {
        playerId,
        answered: true,
      });

      // Get the player's name and color for the detailed answer
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      });

      if (player) {
        // Send detailed answer info to host only
        const answerDetail: PlayerAnswerDetail = {
          playerId,
          playerName: player.name,
          avatarColor: player.avatarColor || "#8A2CF6",
          avatarEmoji: player.avatarEmoji,
          selectedAnswerIds: answerIds,
          isCorrect,
          pointsEarned: points,
          totalScore: player.totalScore,
          position,
          timeToAnswer: timeTaken,
        };

        this.io.to(`game:${upperCode}:host`).emit("game:playerAnswerDetail", {
          questionId,
          answer: answerDetail,
        });
      }
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  }

  private async endQuestion(gameCode: string) {
    const game = this.activeGames.get(gameCode);
    if (!game) return;

    // Clear timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    game.status = "REVEALING";

    const question = game.questions[game.currentQuestionIndex];
    const correctIds = game.correctAnswerIds.get(question.id) || [];

    // Get answer statistics
    const answeredPlayers = game.playerAnswers.get(question.id);
    const answers = await prisma.playerAnswer.findMany({
      where: { questionId: question.id },
    });

    const distribution: Record<string, number> = {};
    for (const answer of answers) {
      const selected = JSON.parse(answer.selectedAnswerIds) as string[];
      for (const id of selected) {
        distribution[id] = (distribution[id] || 0) + 1;
      }
    }

    // Update database
    await prisma.gameSession.update({
      where: { gameCode },
      data: { status: "REVEALING" },
    });

    // Send correct answers and stats
    this.io.to(`game:${gameCode}`).emit("game:questionEnd", {
      correctAnswerIds: correctIds,
      stats: {
        totalAnswered: answeredPlayers?.size || 0,
        answerDistribution: distribution,
      },
    });

    // Send updated scores
    const scores = await this.getPlayerScores(gameCode);
    this.io.to(`game:${gameCode}`).emit("game:scoreUpdate", { scores });

    // Send next question preview to host
    this.sendNextQuestionPreview(gameCode);
  }

  private sendNextQuestionPreview(gameCode: string) {
    const game = this.activeGames.get(gameCode);
    if (!game) return;

    const nextIndex = game.currentQuestionIndex + 1;
    // Count only actual questions (not sections)
    const totalQuestions = game.questions.filter(
      (q) => q.questionType !== "SECTION"
    ).length;

    if (nextIndex < game.questions.length) {
      const nextQuestion = game.questions[nextIndex];
      // Calculate actual question number (excluding sections)
      const questionNumber = game.questions
        .slice(0, nextIndex + 1)
        .filter((q) => q.questionType !== "SECTION").length;

      this.io.to(`game:${gameCode}:host`).emit("game:nextQuestionPreview", {
        question: nextQuestion,
        questionNumber,
        totalQuestions,
      });
    } else {
      // No more questions
      this.io.to(`game:${gameCode}:host`).emit("game:nextQuestionPreview", null);
    }
  }

  private async handleShowScoreboard(
    socket: TypedSocket,
    data: { gameCode: string }
  ) {
    const upperCode = data.gameCode.toUpperCase();
    const game = this.activeGames.get(upperCode);
    if (!game) return;

    game.status = "SCOREBOARD";

    await prisma.gameSession.update({
      where: { gameCode: upperCode },
      data: { status: "SCOREBOARD" },
    });

    const scores = await this.getPlayerScores(upperCode);
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    this.io.to(`game:${upperCode}`).emit("game:showScoreboard", {
      scores,
      phase: isLastQuestion ? "final" : "mid",
    });

    // Update previous positions for next round
    for (const score of scores) {
      game.previousPositions.set(score.playerId, score.position);
    }
  }

  private async handleEndGame(socket: TypedSocket, data: { gameCode: string }) {
    await this.endGame(data.gameCode.toUpperCase());
  }

  private async endGame(gameCode: string) {
    const game = this.activeGames.get(gameCode);
    if (!game) return;

    // Clear timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
    }

    game.status = "FINISHED";

    await prisma.gameSession.update({
      where: { gameCode },
      data: { status: "FINISHED", endedAt: new Date() },
    });

    const scores = await this.getPlayerScores(gameCode);
    const winners = scores.slice(0, 3).map((s) => ({
      id: s.playerId,
      name: s.name,
      avatarColor: s.avatarColor,
      avatarEmoji: s.avatarEmoji,
      score: s.score,
      isActive: true,
    }));

    this.io.to(`game:${gameCode}`).emit("game:finished", {
      finalScores: scores,
      winners,
    });

    // Clean up
    this.activeGames.delete(gameCode);
  }

  private async handleCancelGame(socket: TypedSocket, data: { gameCode: string }) {
    const upperCode = data.gameCode.toUpperCase();
    console.log(`Received cancel game request for ${upperCode}`);

    try {
      // Find the game session
      const gameSession = await prisma.gameSession.findUnique({
        where: { gameCode: upperCode },
      });

      if (!gameSession) {
        socket.emit("error", { message: "Game not found", code: "GAME_NOT_FOUND" });
        return;
      }

      // Only allow cancelling if game is in WAITING status
      if (gameSession.status !== "WAITING") {
        socket.emit("error", { message: "Can only cancel games that haven't started", code: "GAME_STARTED" });
        return;
      }

      // Delete all players first (due to foreign key constraints)
      await prisma.player.deleteMany({
        where: { gameSessionId: gameSession.id },
      });

      // Delete the game session
      await prisma.gameSession.delete({
        where: { gameCode: upperCode },
      });

      // Notify all clients that the game was cancelled
      this.io.to(`game:${upperCode}`).emit("game:cancelled");

      // Clean up any active game state
      this.activeGames.delete(upperCode);

      console.log(`Game ${upperCode} cancelled by host`);
    } catch (error) {
      console.error("Error cancelling game:", error);
      socket.emit("error", { message: "Failed to cancel game", code: "CANCEL_FAILED" });
    }
  }

  private async handleDisconnect(socket: TypedSocket) {
    const playerId = (socket as unknown as { playerId: string }).playerId;
    const gameCode = (socket as unknown as { gameCode: string }).gameCode;

    if (playerId && gameCode) {
      // Mark player as inactive
      await prisma.player.update({
        where: { id: playerId },
        data: { isActive: false, socketId: null },
      });

      this.io.to(`game:${gameCode}`).emit("game:playerLeft", { playerId });
    }

    console.log(`Client disconnected: ${socket.id}`);
  }

  private async getGameState(gameCode: string): Promise<GameState | null> {
    const gameSession = await prisma.gameSession.findUnique({
      where: { gameCode },
      include: {
        quiz: {
          include: {
            questions: {
              select: { id: true, questionType: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        players: {
          where: { isActive: true },
          orderBy: { totalScore: "desc" },
        },
      },
    });

    if (!gameSession) return null;

    const activeGame = this.activeGames.get(gameCode);

    // Count only actual questions (not sections)
    const totalQuestions = gameSession.quiz.questions.filter(
      (q) => q.questionType !== "SECTION"
    ).length;

    // Calculate the current question number (excluding sections)
    const currentQuestionNumber = gameSession.currentQuestionIndex >= 0
      ? gameSession.quiz.questions
          .slice(0, gameSession.currentQuestionIndex + 1)
          .filter((q) => q.questionType !== "SECTION").length
      : 0;

    // Parse theme if present
    const quizTheme = parseTheme(gameSession.quiz.theme);

    return {
      gameCode: gameSession.gameCode,
      status: gameSession.status as GameStatus,
      quizTitle: gameSession.quiz.title,
      quizTheme,
      currentQuestionIndex: gameSession.currentQuestionIndex,
      currentQuestionNumber,
      totalQuestions,
      players: gameSession.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor || "#8A2CF6",
        avatarEmoji: p.avatarEmoji,
        score: p.totalScore,
        isActive: p.isActive,
      })),
      currentQuestion: activeGame?.questions[activeGame.currentQuestionIndex] || null,
      timeRemaining: activeGame?.questionStartedAt
        ? Math.max(
            0,
            activeGame.questions[activeGame.currentQuestionIndex]?.timeLimit -
              Math.floor((Date.now() - activeGame.questionStartedAt) / 1000)
          )
        : undefined,
    };
  }

  private async getPlayerScores(gameCode: string): Promise<PlayerScore[]> {
    const game = this.activeGames.get(gameCode);
    const players = await prisma.player.findMany({
      where: {
        gameSession: { gameCode },
        isActive: true,
      },
      orderBy: { totalScore: "desc" },
    });

    return players.map((p, index) => {
      const previousPosition = game?.previousPositions.get(p.id) || index + 1;
      return {
        playerId: p.id,
        name: p.name,
        avatarColor: p.avatarColor || "#8A2CF6",
        avatarEmoji: p.avatarEmoji,
        score: p.totalScore,
        position: index + 1,
        change: previousPosition - (index + 1),
      };
    });
  }
}
