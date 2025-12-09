import React from "react";
import { format } from "date-fns";
import { CertificateGameData } from "@/types/certificate";
import { PlayerScore } from "@/types";
import { QuizTheme, BORDER_RADIUS_MAP } from "@/types/theme";
import { truncateText } from "./certificate-utils";

/**
 * Get trophy/medal emoji based on position
 */
function getTrophyIcon(position: number): string {
  if (position === 1) return "🏆";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return "";
}

/**
 * Render an avatar for a player
 * Handles emoji avatars, color-only avatars, and potentially uploaded images
 */
function renderAvatar(player: PlayerScore, size: number) {
  // If avatar is an emoji (not starting with /)
  if (player.avatarEmoji && !player.avatarEmoji.startsWith("/")) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: player.avatarColor || "#666",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.6,
        }}
      >
        {player.avatarEmoji}
      </div>
    );
  }

  // For uploaded images or color-only avatars, show initial letter
  const initial = player.name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: player.avatarColor || "#666",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        fontWeight: "bold",
        color: "#FFFFFF",
      }}
    >
      {initial}
    </div>
  );
}

/**
 * Render the podium for top 3 players
 */
function renderPodium(players: PlayerScore[], theme: QuizTheme) {
  if (players.length === 0) return null;

  const top3 = players.slice(0, 3);
  const [first, second, third] = top3;

  // Only show podium if we have at least 3 players
  if (top3.length < 3) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 40,
        marginTop: 40,
        marginBottom: 60,
      }}
    >
      {/* 2nd Place */}
      {second && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 48 }}>{getTrophyIcon(2)}</div>
          {renderAvatar(second, 80)}
          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: 20,
              fontWeight: "bold",
              color: `hsl(${theme.colors.foreground})`,
            }}
          >
            {truncateText(second.name, 15)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: "bold",
              color: `hsl(${theme.colors.primary})`,
            }}
          >
            {second.score}
          </div>
        </div>
      )}

      {/* 1st Place */}
      {first && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 64 }}>{getTrophyIcon(1)}</div>
          {renderAvatar(first, 100)}
          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: 24,
              fontWeight: "bold",
              color: `hsl(${theme.colors.foreground})`,
            }}
          >
            {truncateText(first.name, 15)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: "bold",
              color: `hsl(${theme.colors.primary})`,
            }}
          >
            {first.score}
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 48 }}>{getTrophyIcon(3)}</div>
          {renderAvatar(third, 80)}
          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: 20,
              fontWeight: "bold",
              color: `hsl(${theme.colors.foreground})`,
            }}
          >
            {truncateText(third.name, 15)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: "bold",
              color: `hsl(${theme.colors.primary})`,
            }}
          >
            {third.score}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render the full leaderboard
 */
function renderLeaderboard(
  players: PlayerScore[],
  currentPlayerId: string | null,
  theme: QuizTheme
) {
  // Show all players (limited to reasonable display)
  const displayPlayers = players.slice(0, 30);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        maxWidth: 900,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 32,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20,
          color: `hsl(${theme.colors.foreground})`,
        }}
      >
        Full Leaderboard
      </div>

      {displayPlayers.map((player) => {
        const isCurrentPlayer = player.playerId === currentPlayerId;

        return (
          <div
            key={player.playerId}
            style={{
              display: "flex",
              alignItems: "center",
              padding: 16,
              background: isCurrentPlayer
                ? `hsl(${theme.colors.primary})`
                : `hsl(${theme.colors.card})`,
              borderRadius: BORDER_RADIUS_MAP[theme.effects.borderRadius] || "0.75rem",
              gap: 20,
            }}
          >
            {/* Rank */}
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: "bold",
                width: 50,
                color: isCurrentPlayer
                  ? `hsl(${theme.colors.primaryForeground})`
                  : `hsl(${theme.colors.foreground})`,
              }}
            >
              {player.position}.
            </div>

            {/* Avatar */}
            {renderAvatar(player, 48)}

            {/* Name */}
            <div
              style={{
                display: "flex",
                flex: 1,
                fontSize: 22,
                fontWeight: isCurrentPlayer ? "bold" : "normal",
                color: isCurrentPlayer
                  ? `hsl(${theme.colors.primaryForeground})`
                  : `hsl(${theme.colors.foreground})`,
              }}
            >
              {truncateText(player.name, 25)}
              {isCurrentPlayer && " (You)"}
            </div>

            {/* Score */}
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: "bold",
                color: isCurrentPlayer
                  ? `hsl(${theme.colors.primaryForeground})`
                  : `hsl(${theme.colors.primary})`,
              }}
            >
              {player.score}
            </div>
          </div>
        );
      })}

      {players.length > 30 && (
        <div
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: 18,
            color: `hsl(${theme.colors.foreground})`,
            opacity: 0.7,
            marginTop: 10,
          }}
        >
          ...and {players.length - 30} more players
        </div>
      )}
    </div>
  );
}

/**
 * Generate host certificate showing full leaderboard
 */
export async function generateHostCertificate(
  data: CertificateGameData
): Promise<React.ReactElement> {
  const { quizTitle, completedDate, theme, players } = data;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: theme.gradients.pageBackground,
        padding: 60,
        color: `hsl(${theme.colors.foreground})`,
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          QUIZ0R
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            opacity: 0.9,
          }}
        >
          Certificate of Completion
        </div>
      </div>

      {/* Quiz Info */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          &ldquo;{truncateText(quizTitle, 50)}&rdquo;
        </div>
        <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>
          Completed on {format(completedDate, "MMMM d, yyyy")}
        </div>
      </div>

      {/* Podium */}
      {players.length >= 3 && renderPodium(players, theme)}

      {/* Leaderboard */}
      {renderLeaderboard(players, null, theme)}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 40,
          fontSize: 20,
          opacity: 0.7,
        }}
      >
        <div>Powered by Quiz0r</div>
        <div style={{ fontSize: 16 }}>Available at quiz0r.dev</div>
      </div>
    </div>
  );
}

/**
 * Generate player certificate with personalized message
 */
export async function generatePlayerCertificate(
  data: CertificateGameData,
  playerId: string,
  congratsMessage: string
): Promise<React.ReactElement> {
  const { quizTitle, completedDate, theme, players } = data;

  // Find the player
  const player = players.find((p) => p.playerId === playerId);
  if (!player) {
    throw new Error("Player not found");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: theme.gradients.pageBackground,
        padding: 60,
        color: `hsl(${theme.colors.foreground})`,
        alignItems: "center",
      }}
    >
      {/* Player Achievement Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: `hsl(${theme.colors.card})`,
          padding: 40,
          borderRadius: BORDER_RADIUS_MAP[theme.effects.borderRadius] || "0.75rem",
          marginBottom: 40,
          maxWidth: 800,
        }}
      >
        {/* Trophy Icon */}
        <div style={{ display: "flex", fontSize: 96, marginBottom: 20 }}>
          {getTrophyIcon(player.position)}
        </div>

        {/* Player Avatar */}
        <div style={{ display: "flex", marginBottom: 20 }}>{renderAvatar(player, 120)}</div>

        {/* Congratulations */}
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
            color: `hsl(${theme.colors.foreground})`,
          }}
        >
          Congratulations, {truncateText(player.name, 20)}!
        </div>

        {/* Position */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            textAlign: "center",
            marginBottom: 30,
            color: `hsl(${theme.colors.primary})`,
            fontWeight: "bold",
          }}
        >
          You finished in {player.position}
          {player.position === 1 ? "st" : player.position === 2 ? "nd" : player.position === 3 ? "rd" : "th"} place!
        </div>

        {/* AI-Generated Message */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            textAlign: "center",
            lineHeight: 1.5,
            opacity: 0.9,
            maxWidth: 700,
            color: `hsl(${theme.colors.cardForeground})`,
          }}
        >
          {congratsMessage}
        </div>
      </div>

      {/* Quiz Details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 30,
          gap: 10,
        }}
      >
        <div style={{ display: "flex", fontSize: 24, fontWeight: "bold" }}>
          Quiz: &ldquo;{truncateText(quizTitle, 50)}&rdquo;
        </div>
        <div style={{ display: "flex", fontSize: 22 }}>
          Score: {player.score} points
        </div>
        <div style={{ display: "flex", fontSize: 20, opacity: 0.8 }}>
          {format(completedDate, "MMMM d, yyyy")}
        </div>
      </div>

      {/* Leaderboard */}
      {renderLeaderboard(players, playerId, theme)}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 40,
          fontSize: 20,
          opacity: 0.7,
        }}
      >
        <div>Powered by Quiz0r</div>
        <div style={{ fontSize: 16 }}>Available at quiz0r.dev</div>
      </div>
    </div>
  );
}
