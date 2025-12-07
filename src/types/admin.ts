export interface GameListItem {
  id: string;
  gameCode: string;
  status: string;
  createdAt: Date;
  endedAt: Date | null;
  quiz: {
    id: string;
    title: string;
  };
  playerCount: number;
  topPlayers: Array<{
    id: string;
    name: string;
    avatarColor: string;
    avatarEmoji: string | null;
    totalScore: number;
  }>;
}

export interface GameFilters {
  status: "ALL" | "RUNNING" | "FINISHED";
  search: string;
  sortBy: "date" | "quizName" | "playerCount";
  sortOrder: "asc" | "desc";
}

export interface GamesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GameDetailPlayer {
  id: string;
  name: string;
  avatarColor: string;
  avatarEmoji: string | null;
  totalScore: number;
  position: number;
}

export interface GameDetail extends GameListItem {
  allPlayers: GameDetailPlayer[];
}
