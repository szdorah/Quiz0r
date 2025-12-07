import { PasswordStrength } from "@/types/settings-export";

export function calculatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length < 12) {
    feedback.push("Password must be at least 12 characters");
    return { score: 0, feedback, isValid: false };
  }

  // Scoring based on length and character variety
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(
    Boolean
  ).length;

  if (varietyCount >= 2) score++;
  if (varietyCount >= 3) score++;

  // Generate feedback
  if (score === 1) {
    feedback.push("Add uppercase letters, numbers, or symbols");
  } else if (score === 2) {
    feedback.push("Consider adding more character variety");
  } else if (score === 3) {
    feedback.push("Strong password!");
  } else if (score === 4) {
    feedback.push("Very strong password!");
  }

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    feedback,
    isValid: score >= 1,
  };
}
