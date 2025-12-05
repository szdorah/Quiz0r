"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  GameState,
  PlayerInfo,
  QuestionData,
  PlayerScore,
  AnswerStats,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  gameCode: string;
  role: "host" | "player";
  playerName?: string;
}

interface UseSocketReturn {
  socket: TypedSocket | null;
  connected: boolean;
  gameState: GameState | null;
  currentQuestion: QuestionData | null;
  timeRemaining: number;
  scores: PlayerScore[];
  answerResult: { correct: boolean; points: number; position: number } | null;
  questionEnded: { correctAnswerIds: string[]; stats: AnswerStats } | null;
  error: string | null;
  // Actions
  startGame: () => void;
  nextQuestion: () => void;
  showScoreboard: () => void;
  endGame: () => void;
  submitAnswer: (questionId: string, answerIds: string[]) => void;
}

export function useSocket({
  gameCode,
  role,
  playerName,
}: UseSocketOptions): UseSocketReturn {
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    points: number;
    position: number;
  } | null>(null);
  const [questionEnded, setQuestionEnded] = useState<{
    correctAnswerIds: string[];
    stats: AnswerStats;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket
    const socket: TypedSocket = io({
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
      setError(null);

      // Join room based on role
      if (role === "host") {
        socket.emit("host:joinRoom", { gameCode: gameCode.toUpperCase() });
      } else if (role === "player" && playerName) {
        socket.emit("player:join", {
          gameCode: gameCode.toUpperCase(),
          name: playerName,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    socket.on("game:state", (state) => {
      setGameState(state);
      if (state.currentQuestion) {
        setCurrentQuestion(state.currentQuestion);
      }
      if (state.timeRemaining !== undefined) {
        setTimeRemaining(state.timeRemaining);
      }
    });

    socket.on("game:playerJoined", ({ player }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const exists = prev.players.some((p) => p.id === player.id);
        if (exists) {
          return {
            ...prev,
            players: prev.players.map((p) => (p.id === player.id ? player : p)),
          };
        }
        return { ...prev, players: [...prev.players, player] };
      });
    });

    socket.on("game:playerLeft", ({ playerId }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === playerId ? { ...p, isActive: false } : p
          ),
        };
      });
    });

    socket.on("game:questionStart", ({ question, startTime }) => {
      setCurrentQuestion(question);
      setTimeRemaining(question.timeLimit);
      setAnswerResult(null);
      setQuestionEnded(null);
      setGameState((prev) =>
        prev ? { ...prev, status: "QUESTION", currentQuestion: question } : prev
      );
    });

    socket.on("game:timerTick", ({ remaining }) => {
      setTimeRemaining(remaining);
    });

    socket.on("game:answerReceived", ({ playerId, answered }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === playerId ? { ...p, hasAnswered: answered } : p
          ),
        };
      });
    });

    socket.on("game:questionEnd", (data) => {
      setQuestionEnded(data);
      setGameState((prev) => (prev ? { ...prev, status: "REVEALING" } : prev));
    });

    socket.on("game:scoreUpdate", ({ scores: newScores }) => {
      setScores(newScores);
    });

    socket.on("game:showScoreboard", ({ scores: newScores, phase }) => {
      setScores(newScores);
      setGameState((prev) => (prev ? { ...prev, status: "SCOREBOARD" } : prev));
    });

    socket.on("game:finished", ({ finalScores, winners }) => {
      setScores(finalScores);
      setGameState((prev) => (prev ? { ...prev, status: "FINISHED" } : prev));
    });

    socket.on("player:answerResult", (result) => {
      setAnswerResult(result);
    });

    socket.on("error", ({ message, code }) => {
      console.error("Socket error:", code, message);
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [gameCode, role, playerName]);

  const startGame = useCallback(() => {
    socketRef.current?.emit("host:startGame", { gameCode: gameCode.toUpperCase() });
  }, [gameCode]);

  const nextQuestion = useCallback(() => {
    socketRef.current?.emit("host:nextQuestion", { gameCode: gameCode.toUpperCase() });
  }, [gameCode]);

  const showScoreboard = useCallback(() => {
    socketRef.current?.emit("host:showScoreboard", { gameCode: gameCode.toUpperCase() });
  }, [gameCode]);

  const endGame = useCallback(() => {
    socketRef.current?.emit("host:endGame", { gameCode: gameCode.toUpperCase() });
  }, [gameCode]);

  const submitAnswer = useCallback(
    (questionId: string, answerIds: string[]) => {
      socketRef.current?.emit("player:answer", {
        gameCode: gameCode.toUpperCase(),
        questionId,
        answerIds,
      });
    },
    [gameCode]
  );

  return {
    socket: socketRef.current,
    connected,
    gameState,
    currentQuestion,
    timeRemaining,
    scores,
    answerResult,
    questionEnded,
    error,
    startGame,
    nextQuestion,
    showScoreboard,
    endGame,
    submitAnswer,
  };
}
