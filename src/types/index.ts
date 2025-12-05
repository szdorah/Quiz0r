// Question types
export const QuestionType = {
  SINGLE_SELECT: "SINGLE_SELECT",
  MULTI_SELECT: "MULTI_SELECT",
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

// Game status types
export const GameStatus = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  QUESTION: "QUESTION",
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
  currentQuestionIndex: number;
  totalQuestions: number;
  players: PlayerInfo[];
  currentQuestion?: QuestionData | null;
  timeRemaining?: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatarColor: string;
  avatarEmoji?: string | null;
  score: number;
  isActive: boolean;
  hasAnswered?: boolean;
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

// Socket events - Server to Client
export interface ServerToClientEvents {
  "game:state": (state: GameState) => void;
  "game:playerJoined": (data: { player: PlayerInfo }) => void;
  "game:playerLeft": (data: { playerId: string }) => void;
  "game:questionStart": (data: {
    question: QuestionData;
    startTime: number;
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
  "player:answerResult": (data: {
    correct: boolean;
    points: number;
    position: number;
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
  "player:join": (data: { gameCode: string; name: string }) => void;
  "player:answer": (data: {
    gameCode: string;
    questionId: string;
    answerIds: string[];
  }) => void;
  "player:reconnect": (data: { gameCode: string; playerId: string }) => void;
}
