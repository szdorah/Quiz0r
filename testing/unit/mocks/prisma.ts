import { GameStatus } from "@/types";

type MockQuizAnswer = {
  id: string;
  answerText: string;
  isCorrect: boolean;
  imageUrl?: string | null;
  orderIndex: number;
  translations?: any[];
};

type MockQuizQuestion = {
  id: string;
  questionText: string;
  questionType: "SINGLE_SELECT" | "MULTI_SELECT" | "SECTION";
  timeLimit: number;
  points: number;
  orderIndex: number;
  answers: MockQuizAnswer[];
  translations?: any[];
  hostNotes?: string | null;
  hint?: string | null;
  imageUrl?: string | null;
  easterEggEnabled?: boolean;
  easterEggButtonText?: string | null;
  easterEggUrl?: string | null;
  easterEggDisablesScoring?: boolean;
};

type MockQuiz = {
  id: string;
  title: string;
  theme?: string | null;
  questions: MockQuizQuestion[];
  hintCount?: number;
  copyAnswerCount?: number;
  doublePointsCount?: number;
};

export type MockGameSession = {
  id: string;
  gameCode: string;
  status: GameStatus;
  autoAdmit: boolean;
  quizId: string;
  quiz: MockQuiz;
  players: MockPlayer[];
  currentQuestionIndex: number;
  questionStartedAt?: Date | null;
  endedAt?: Date | null;
};

export type MockPlayer = {
  id: string;
  name: string;
  gameSessionId: string;
  socketId?: string | null;
  avatarColor?: string | null;
  avatarEmoji?: string | null;
  totalScore: number;
  admissionStatus: "admitted" | "pending" | "refused";
  isActive: boolean;
  languageCode?: string;
  removedAt?: Date | null;
};

type MockPowerUpUsage = {
  id: string;
  playerId: string;
  questionId: string;
  powerUpType: string;
  copiedPlayerId?: string | null;
  question: { orderIndex: number };
};

type MockPlayerAnswer = {
  playerId: string;
  questionId: string;
  selectedAnswerIds: string;
  isCorrect: boolean;
  timeToAnswer: number;
  pointsEarned: number;
};

type MockEasterEgg = {
  playerId: string;
  questionId: string;
};

type MockCertificate = {
  id: string;
  gameSessionId: string;
  type: "player" | "host";
  playerId?: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  retryCount: number;
  errorMessage?: string | null;
  filePath?: string | null;
  aiMessage?: string | null;
  completedAt?: Date | null;
};

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Lightweight in-memory Prisma mock to exercise realtime and scoring logic.
 * Only implements the methods used by the tests.
 */
export class PrismaClient {
  static instance?: PrismaClient;

  private gameSessions = new Map<string, MockGameSession>();
  private players = new Map<string, MockPlayer>();
  private powerUpUsages = new Map<string, MockPowerUpUsage>();
  private playerAnswers = new Map<string, MockPlayerAnswer>();
  private easterEggClicks = new Set<string>();
  private certificates = new Map<string, MockCertificate>();
  private settings = new Map<string, string>();

  constructor() {
    PrismaClient.instance = this;
  }

  reset() {
    this.gameSessions.clear();
    this.players.clear();
    this.powerUpUsages.clear();
    this.playerAnswers.clear();
    this.easterEggClicks.clear();
    this.certificates.clear();
    this.settings.clear();
  }

  getPlayerCount() {
    return this.players.size;
  }

  getPlayerAnswerCount() {
    return this.playerAnswers.size;
  }

  seedGameSession(session: MockGameSession) {
    this.gameSessions.set(session.gameCode.toUpperCase(), session);
    session.players.forEach((p) => this.players.set(p.id, p));
  }

  seedSetting(key: string, value: string) {
    this.settings.set(key, value);
  }

  // --- Game session ---
  gameSession = {
    findUnique: async ({ where, include }: any) => {
      const code = (where?.gameCode ?? where?.gameCode?.toUpperCase())?.toUpperCase();
      const byId = where?.id;
      const session = byId
        ? Array.from(this.gameSessions.values()).find((s) => s.id === byId)
        : this.gameSessions.get(code);
      if (!session) return null;

      if (!include) return { ...session };

      const withIncludes: any = { ...session };
      if (include.quiz) {
        withIncludes.quiz = session.quiz;
      }
      if (include.players) {
        const players = Array.from(this.players.values()).filter(
          (p) =>
            p.gameSessionId === session.id &&
            (!include.players.where?.isActive || p.isActive === include.players.where.isActive) &&
            (!include.players.where?.admissionStatus ||
              p.admissionStatus === include.players.where.admissionStatus)
        );
        withIncludes.players = players.sort((a, b) => b.totalScore - a.totalScore);
      }
      return withIncludes;
    },
    update: async ({ where, data }: any) => {
      const code = (where?.gameCode ?? where?.gameCode?.toUpperCase()).toUpperCase();
      const session = this.gameSessions.get(code);
      if (!session) throw new Error("Session not found");
      const updated: MockGameSession = { ...session, ...data };
      this.gameSessions.set(code, updated);
      return updated;
    },
    delete: async ({ where }: any) => {
      const code = where?.gameCode?.toUpperCase();
      this.gameSessions.delete(code);
      return { count: 1 };
    },
  };

  // --- Player ---
  player = {
    findUnique: async ({ where }: any) => {
      if (where?.id) {
        return this.players.get(where.id) || null;
      }
      if (where?.gameSessionId_name) {
        const { gameSessionId, name } = where.gameSessionId_name;
        return (
          Array.from(this.players.values()).find(
            (p) => p.gameSessionId === gameSessionId && p.name === name
          ) || null
        );
      }
      return null;
    },
    create: async ({ data }: any) => {
      const player: MockPlayer = {
        ...data,
        id: data.id ?? genId("player"),
        totalScore: data.totalScore ?? 0,
        isActive: data.isActive ?? true,
      };
      this.players.set(player.id, player);
      return player;
    },
    update: async ({ where, data }: any) => {
      const player = this.players.get(where.id);
      if (!player) throw new Error("Player not found");

      let totalScore = player.totalScore;
      if (data.totalScore?.increment) {
        totalScore += data.totalScore.increment;
      } else if (typeof data.totalScore === "number") {
        totalScore = data.totalScore;
      }

      const updated: MockPlayer = {
        ...player,
        ...data,
        totalScore,
      };
      this.players.set(player.id, updated);
      return updated;
    },
    deleteMany: async ({ where }: any) => {
      const toDelete = Array.from(this.players.values()).filter(
        (p) => !where?.gameSessionId || p.gameSessionId === where.gameSessionId
      );
      toDelete.forEach((p) => this.players.delete(p.id));
      return { count: toDelete.length };
    },
    findMany: async ({ where, orderBy }: any) => {
      const filtered = Array.from(this.players.values()).filter((p) => {
        if (where?.gameSession?.gameCode && p.gameSessionId) {
          const session = Array.from(this.gameSessions.values()).find(
            (s) => s.id === p.gameSessionId
          );
          if (!session || session.gameCode !== where.gameSession.gameCode) {
            return false;
          }
        }
        if (where?.isActive !== undefined && p.isActive !== where.isActive) return false;
        if (
          where?.admissionStatus &&
          p.admissionStatus !== where.admissionStatus
        )
          return false;
        return true;
      });

      if (orderBy?.totalScore === "desc") {
        filtered.sort((a, b) => b.totalScore - a.totalScore);
      }
      return filtered;
    },
  };

  // --- Power-up usage ---
  powerUpUsage = {
    findMany: async ({ where, include }: any) => {
      const usages = Array.from(this.powerUpUsages.values()).filter((u) => {
        if (where?.playerId && u.playerId !== where.playerId) return false;
        if (where?.playerId?.in && !where.playerId.in.includes(u.playerId)) return false;
        if (where?.questionId && u.questionId !== where.questionId) return false;
        return true;
      });

      if (include?.question) {
        return usages.map((u) => ({
          ...u,
          question: u.question,
        }));
      }

      return usages;
    },
    create: async ({ data }: any) => {
      const record: MockPowerUpUsage = {
        ...data,
        id: data.id ?? genId("powerup"),
        question: data.question ?? { orderIndex: 0 },
      };
      this.powerUpUsages.set(record.id, record);
      return record;
    },
    delete: async ({ where }: any) => {
      this.powerUpUsages.delete(where.id);
      return { count: 1 };
    },
  };

  // --- Player answers ---
  playerAnswer = {
    create: async ({ data }: any) => {
      const key = `${data.playerId}:${data.questionId}`;
      const record: MockPlayerAnswer = {
        ...data,
        selectedAnswerIds:
          typeof data.selectedAnswerIds === "string"
            ? data.selectedAnswerIds
            : JSON.stringify(data.selectedAnswerIds),
      };
      this.playerAnswers.set(key, record);
      return record;
    },
    findMany: async ({ where }: any) => {
      return Array.from(this.playerAnswers.values()).filter((a) => {
        if (where?.questionId && a.questionId !== where.questionId) return false;
        return true;
      });
    },
    findUnique: async ({ where }: any) => {
      const key = `${where.playerId_questionId.playerId}:${where.playerId_questionId.questionId}`;
      return this.playerAnswers.get(key) || null;
    },
  };

  // --- Easter eggs ---
  easterEggClick = {
    findUnique: async ({ where }: any) => {
      const key = `${where.playerId_questionId.playerId}:${where.playerId_questionId.questionId}`;
      return this.easterEggClicks.has(key)
        ? ({ playerId: where.playerId_questionId.playerId, questionId: where.playerId_questionId.questionId } as MockEasterEgg)
        : null;
    },
    create: async ({ data }: any) => {
      const key = `${data.playerId}:${data.questionId}`;
      this.easterEggClicks.add(key);
      return data as MockEasterEgg;
    },
  };

  // --- Certificates (minimal stub) ---
  certificate = {
    create: async ({ data }: any) => {
      const cert: MockCertificate = {
        ...data,
        id: data.id ?? genId("cert"),
        retryCount: data.retryCount ?? 0,
        status: data.status ?? "pending",
      };
      this.certificates.set(cert.id, cert);
      return cert;
    },
    update: async ({ where, data }: any) => {
      const cert = this.certificates.get(where.id);
      if (!cert) throw new Error("Certificate not found");
      const updated: MockCertificate = { ...cert, ...data };
      this.certificates.set(cert.id, updated);
      return updated;
    },
    findUnique: async ({ where }: any) => {
      return this.certificates.get(where.id) || null;
    },
    findMany: async ({ where }: any = {}) => {
      return Array.from(this.certificates.values()).filter((c) => {
        if (where?.gameSession?.gameCode) {
          const session = Array.from(this.gameSessions.values()).find(
            (s) => s.id === c.gameSessionId
          );
          return session?.gameCode === where.gameSession.gameCode;
        }
        return true;
      });
    },
    updateMany: async ({ where, data }: any) => {
      const ids = Array.from(this.certificates.values())
        .filter((c) => where.id?.in?.includes(c.id))
        .map((c) => c.id);
      ids.forEach((id) => {
        const current = this.certificates.get(id);
        if (current) {
          this.certificates.set(id, { ...current, ...data });
        }
      });
      return { count: ids.length };
    },
  };

  // --- Settings ---
  setting = {
    findUnique: async ({ where }: any) => {
      const value = this.settings.get(where.key);
      return value ? { key: where.key, value } : null;
    },
    upsert: async ({ where, create, update }: any) => {
      const value = this.settings.get(where.key);
      const newValue = value ? update.value : create.value;
      this.settings.set(where.key, newValue);
      return { key: where.key, value: newValue };
    },
    deleteMany: async ({ where }: any) => {
      const keys = Array.from(this.settings.keys()).filter((k) => k === where.key);
      keys.forEach((k) => this.settings.delete(k));
      return { count: keys.length };
    },
  };
}

export function getPrismaMock(): PrismaClient {
  if (!PrismaClient.instance) {
    throw new Error("Prisma mock not initialized");
  }
  return PrismaClient.instance;
}
