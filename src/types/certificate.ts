import { PlayerScore } from "./index";
import { QuizTheme } from "./theme";

export interface CertificateGameData {
  gameCode: string;
  quizTitle: string;
  completedDate: Date;
  theme: QuizTheme;
  players: PlayerScore[]; // All players, ordered by score descending
}

export interface CertificateRequest {
  type: "host" | "player";
  playerId?: string; // Required for player certificates
}

export interface PlayerCertificateData extends CertificateGameData {
  playerId: string;
  congratsMessage: string;
}
