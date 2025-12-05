/**
 * Calculate score for a single-select question
 * Score = basePoints * (1 + speedMultiplier) where speedMultiplier is 0-0.5
 */
export function calculateSingleSelectScore(
  basePoints: number,
  timeLimitMs: number,
  timeTakenMs: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;

  // Speed bonus: faster answers get more points (up to 50% bonus)
  const speedRatio = 1 - timeTakenMs / timeLimitMs;
  const speedMultiplier = Math.max(0, speedRatio * 0.5);

  return Math.round(basePoints * (1 + speedMultiplier));
}

/**
 * Calculate score for a multi-select question with partial credit
 * Score = basePoints * (correctSelected - wrongSelected) / totalCorrect * (1 + speedMultiplier)
 *
 * Example: 4 correct answers, player selects 3 correct + 1 wrong
 * Score = 100 * (3 - 1) / 4 = 50 points (before speed bonus)
 */
export function calculateMultiSelectScore(
  basePoints: number,
  timeLimitMs: number,
  timeTakenMs: number,
  selectedAnswerIds: string[],
  correctAnswerIds: string[]
): number {
  const totalCorrect = correctAnswerIds.length;
  if (totalCorrect === 0) return 0;

  // Count correct and wrong selections
  let correctSelected = 0;
  let wrongSelected = 0;

  for (const id of selectedAnswerIds) {
    if (correctAnswerIds.includes(id)) {
      correctSelected++;
    } else {
      wrongSelected++;
    }
  }

  // Calculate base score with partial credit
  // Penalize wrong selections
  const correctnessRatio = Math.max(
    0,
    (correctSelected - wrongSelected) / totalCorrect
  );

  if (correctnessRatio <= 0) return 0;

  // Speed bonus (same as single select)
  const speedRatio = 1 - timeTakenMs / timeLimitMs;
  const speedMultiplier = Math.max(0, speedRatio * 0.5);

  return Math.round(basePoints * correctnessRatio * (1 + speedMultiplier));
}

/**
 * Check if an answer is fully correct (all correct options selected, no wrong ones)
 */
export function isFullyCorrect(
  selectedAnswerIds: string[],
  correctAnswerIds: string[]
): boolean {
  if (selectedAnswerIds.length !== correctAnswerIds.length) return false;

  const selectedSet = new Set(selectedAnswerIds);
  return correctAnswerIds.every((id) => selectedSet.has(id));
}

/**
 * Generate a random avatar color
 */
export function generateAvatarColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
    "#BB8FCE", // Purple
    "#85C1E9", // Sky
    "#F8B500", // Orange
    "#00CED1", // Cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
