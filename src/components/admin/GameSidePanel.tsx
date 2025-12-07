"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { X, ExternalLink } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { CertificateDownloadButton } from "@/components/certificate/CertificateDownloadButton";
import { GameDetail } from "@/types/admin";
import { format } from "date-fns";

interface GameSidePanelProps {
  gameId: string | null;
  onClose: () => void;
}

export function GameSidePanel({ gameId, onClose }: GameSidePanelProps) {
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // WebSocket for live updates (only for running games)
  const isRunning = game?.status !== "FINISHED";
  const { scores, connected } = useSocket({
    gameCode: game?.gameCode || "",
    role: "host",
    // Only connect if game is running
    enabled: isRunning && !!game,
  });

  // Fetch full game details when panel opens
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      return;
    }

    async function fetchGameDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/games/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data);
        }
      } catch (error) {
        console.error("Failed to fetch game details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGameDetails();
  }, [gameId]);

  // Update scores from WebSocket
  useEffect(() => {
    if (scores.length > 0 && game) {
      setGame((prev) =>
        prev
          ? {
              ...prev,
              allPlayers: scores.map((s, idx) => ({
                id: s.playerId,
                name: s.name,
                avatarColor: s.avatarColor,
                avatarEmoji: s.avatarEmoji || null,
                totalScore: s.score,
                position: idx + 1,
              })),
            }
          : null
      );
    }
  }, [scores, game]);

  if (!gameId) return null;

  return (
    <Dialog open={!!gameId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game: {game?.gameCode}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : game ? (
          <div className="space-y-6">
            {/* Game Info */}
            <div>
              <h3 className="font-bold text-lg">{game.quiz.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Badge variant={isRunning ? "default" : "secondary"}>
                  {isRunning ? "Running" : "Finished"}
                </Badge>
                <span>•</span>
                <span>{game.playerCount} players</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {game.endedAt
                  ? `Ended ${format(
                      new Date(game.endedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}`
                  : `Started ${format(
                      new Date(game.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}`}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {!isRunning && (
                <CertificateDownloadButton
                  gameCode={game.gameCode}
                  type="host"
                />
              )}

              {isRunning && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(`/host/${game.gameCode}/control`, "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Resume Host Control
                </Button>
              )}
            </div>

            {/* Leaderboard */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                Leaderboard
                {isRunning && connected && (
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                )}
              </h4>

              <div className="space-y-2">
                {game.allPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border"
                  >
                    <span className="font-bold text-sm w-8">
                      {player.position}.
                    </span>

                    <Avatar
                      style={{ backgroundColor: player.avatarColor }}
                      className="w-10 h-10"
                    >
                      {player.avatarEmoji || player.name.charAt(0)}
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.totalScore} points
                      </p>
                    </div>

                    {!isRunning && (
                      <CertificateDownloadButton
                        gameCode={game.gameCode}
                        playerId={player.id}
                        playerName={player.name}
                        type="player"
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
