/// <reference types="vitest" />
/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "@/components/settings/PasswordStrengthIndicator";

const strength = {
  score: 3 as 0 | 1 | 2 | 3 | 4,
  feedback: ["Strong password!"],
  isValid: true,
};

describe("PasswordStrengthIndicator", () => {
  it("renders label and feedback based on strength score", () => {
    render(<PasswordStrengthIndicator strength={strength} />);
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Strong password!")).toBeInTheDocument();
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "75");
  });
});
