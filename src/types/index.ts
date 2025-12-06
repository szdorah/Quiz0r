import { QuizTheme } from "./theme";

// Question types
export const QuestionType = {
  SINGLE_SELECT: "SINGLE_SELECT",
  MULTI_SELECT: "MULTI_SELECT",
  SECTION: "SECTION",
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

// Game status types
export const GameStatus = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  QUESTION: "QUESTION",
  SECTION: "SECTION",
  REVEALING: "REVEALING",
  SCOREBOARD: "SCOREBOARD",
  FINISHED: "FINISHED",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

// Socket event types
export interface GameState {
  gameCode: string;
  status: GameStatus;
  quizTitle: string;
  quizTheme: QuizTheme | null; // Quiz theme for styling
  currentQuestionIndex: number;
  currentQuestionNumber: number; // Excludes sections from count
  totalQuestions: number; // Excludes sections from count
  players: PlayerInfo[];
  currentQuestion?: QuestionData | null;
  timeRemaining?: number;
  autoAdmit?: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatarColor: string;
  avatarEmoji?: string | null;
  score: number;
  isActive: boolean;
  hasAnswered?: boolean;
  admissionStatus?: "admitted" | "pending" | "refused";
  downloadStatus?: {
    percentage: number;
    status: 'idle' | 'loading' | 'complete' | 'error';
  };
}

export interface QuestionData {
  id: string;
  questionText: string;
  imageUrl?: string | null;
  hostNotes?: string | null;
  questionType: QuestionType;
  timeLimit: number;
  points: number;
  answers: AnswerOption[];
  easterEggEnabled?: boolean;
  easterEggButtonText?: string | null;
  easterEggUrl?: string | null;
  easterEggDisablesScoring?: boolean;
}

export interface AnswerOption {
  id: string;
  answerText: string;
  imageUrl?: string | null;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  avatarColor: string;
  avatarEmoji?: string | null;
  score: number;
  position: number;
  change: number;
}

export interface AnswerStats {
  totalAnswered: number;
  answerDistribution: Record<string, number>;
}

export interface PlayerAnswerDetail {
  playerId: string;
  playerName: string;
  avatarColor: string;
  avatarEmoji?: string | null;
  selectedAnswerIds: string[];
  isCorrect: boolean;
  pointsEarned: number;
  totalScore: number;
  position: number;
  timeToAnswer: number;
}

export interface EasterEggClickDetail {
  playerId: string;
  playerName: string;
  avatarColor: string;
  avatarEmoji?: string | null;
  clickedAt: number;
}

export interface QuizPreloadData {
  quizTitle: string;
  totalQuestions: number;
  questions: QuestionData[];
  theme: QuizTheme | null;
  imageUrls: string[];
  startIndex?: number;
}

// Socket events - Server to Client
export interface ServerToClientEvents {
  "game:state": (state: GameState) => void;
  "game:playerJoined": (data: { player: PlayerInfo }) => void;
  "game:playerLeft": (data: { playerId: string }) => void;
  "game:questionStart": (data: {
    question: QuestionData;
    questionIndex: number;
    questionNumber: number;
    startTime: number | null;
  }) => void;
  "game:timerTick": (data: { remaining: number }) => void;
  "game:answerReceived": (data: {
    playerId: string;
    answered: boolean;
  }) => void;
  "game:playerAnswerDetail": (data: {
    questionId: string;
    answer: PlayerAnswerDetail;
  }) => void;
  "game:questionEnd": (data: {
    correctAnswerIds: string[];
    stats: AnswerStats;
  }) => void;
  "game:scoreUpdate": (data: { scores: PlayerScore[] }) => void;
  "game:showScoreboard": (data: {
    scores: PlayerScore[];
    phase: "mid" | "final";
  }) => void;
  "game:finished": (data: {
    finalScores: PlayerScore[];
    winners: PlayerInfo[];
  }) => void;
  "game:cancelled": () => void;
  "game:nextQuestionPreview": (data: {
    question: QuestionData;
    questionNumber: number;
    totalQuestions: number;
  } | null) => void;
  "player:answerResult": (data: {
    correct: boolean;
    points: number;
    position: number;
  }) => void;
  "game:quizDataPreload": (data: QuizPreloadData) => void;
  "game:playerPreloadUpdate": (data: {
    playerId: string;
    percentage: number;
    status: 'idle' | 'loading' | 'complete' | 'error';
  }) => void;
  "game:playerRemoved": (data: { playerId: string }) => void;
  "player:removed": (data: { reason: string }) => void;
  "game:admissionRequest": (data: { playerId: string; playerName: string }) => void;
  "player:admissionStatus": (data: { status: "admitted" | "refused" }) => void;
  "game:easterEggClick": (data: {
    questionId: string;
    click: EasterEggClickDetail;
  }) => void;
  error: (data: { message: string; code: string }) => void;
}

// Socket events - Client to Server
export interface ClientToServerEvents {
  "host:joinRoom": (data: { gameCode: string }) => void;
  "host:startGame": (data: { gameCode: string }) => void;
  "host:nextQuestion": (data: { gameCode: string }) => void;
  "host:showScoreboard": (data: { gameCode: string }) => void;
  "host:endGame": (data: { gameCode: string }) => void;
  "host:pauseGame": (data: { gameCode: string }) => void;
  "host:resumeGame": (data: { gameCode: string }) => void;
  "host:skipTimer": (data: { gameCode: string }) => void;
  "host:cancelGame": (data: { gameCode: string }) => void;
  "player:join": (data: { gameCode: string; name: string }) => void;
  "player:answer": (data: {
    gameCode: string;
    questionId: string;
    answerIds: string[];
  }) => void;
  "player:reconnect": (data: { gameCode: string; playerId: string }) => void;
  "player:preloadProgress": (data: {
    gameCode: string;
    playerId: string;
    percentage: number;
    loadedAssets: number;
    totalAssets: number;
    status: 'idle' | 'loading' | 'complete' | 'error';
  }) => void;
  "host:removePlayer": (data: { gameCode: string; playerId: string }) => void;
  "host:admitPlayer": (data: { gameCode: string; playerId: string }) => void;
  "host:refusePlayer": (data: { gameCode: string; playerId: string }) => void;
  "host:toggleAutoAdmit": (data: { gameCode: string; autoAdmit: boolean }) => void;
  "player:easterEggClick": (data: {
    gameCode: string;
    questionId: string;
  }) => void;
}
