// User-friendly template for AI theme generation

export interface ThemeWizardAnswers {
  topic: string;
  mood: string;
  colors: string;
  backgroundAnimation: string;
  celebration: string;
}

/**
 * Generates a full AI prompt from user-friendly answers
 */
export function generateAIPrompt(answers: ThemeWizardAnswers): string {
  return `I need a theme for my quiz game. Please create the JSON code for me.

My quiz topic is: ${answers.topic}

I want the mood/feeling to be: ${answers.mood}

My preferred colors are: ${answers.colors || "you choose colors that match the topic"}

Background animation I'd like: ${answers.backgroundAnimation}

Celebration effect when someone gets an answer right: ${answers.celebration}

---

Please generate valid JSON in this exact format. The output must be copy-paste ready with NO markdown formatting (no \`\`\` blocks).

{
  "name": "[Theme Name based on topic]",
  "version": "1.0",
  "colors": {
    "primary": "[HSL value like '265 91% 57%' - main accent color that fits the mood]",
    "primaryForeground": "[HSL - text on primary buttons, usually '0 0% 100%' for white]",
    "background": "[HSL - dark page background like '240 10% 8%']",
    "foreground": "[HSL - main text color, light like '0 0% 98%']",
    "card": "[HSL - card backgrounds, slightly lighter than background]",
    "cardForeground": "[HSL - card text color]"
  },
  "answerColors": {
    "a": "[Hex color for Answer A button like #EF4444]",
    "b": "[Hex color for Answer B button like #3B82F6]",
    "c": "[Hex color for Answer C button like #EAB308]",
    "d": "[Hex color for Answer D button like #22C55E]",
    "e": "[Hex color for Answer E button like #A855F7]",
    "f": "[Hex color for Answer F button like #F97316]"
  },
  "selectedAnswer": {
    "ringColor": "[Hex color for ring around selected answers]",
    "ringWidth": "4px",
    "scale": 1.05,
    "glow": "[CSS box-shadow for glow effect like '0 0 20px rgba(255,255,255,0.5)']"
  },
  "gradients": {
    "pageBackground": "[CSS gradient for page background like 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)']",
    "sectionSlide": "[CSS gradient for section transition slides]",
    "correctAnswer": "[CSS gradient shown when revealing correct answer, typically green]",
    "wrongAnswer": "[CSS gradient shown when revealing wrong answer, typically red]"
  },
  "effects": {
    "borderRadius": "[one of: none, sm, md, lg, xl]",
    "shadow": "[one of: none, sm, md, lg, xl]",
    "blur": [true or false for glassmorphism effect]
  },
  "animations": {
    "questionEnter": "[one of: none, fade, slide-up, slide-down, scale, bounce]",
    "answerReveal": "[one of: none, fade, scale, flip]",
    "correctCelebration": "[one of: none, confetti, sparkle, glow, fireworks]",
    "timerWarning": "[one of: none, pulse, shake]",
    "scoreboardEntry": "[one of: none, fade, slide-up, bounce]"
  },
  "customCSS": {
    "backgroundAnimation": "[CSS keyframes for background animation like snow, stars, bubbles, etc. - INCLUDE THE FULL @keyframes RULE]"
  }
}

IMPORTANT GUIDELINES:
1. All colors in the "colors" object must be HSL format WITHOUT the hsl() wrapper: "265 91% 57%"
2. All colors in "answerColors" and "selectedAnswer.ringColor" must be HEX format: "#EF4444"
3. Make sure all 6 answer colors are visually distinct and match the theme mood
4. The gradients should be full CSS gradient strings
5. For the customCSS.backgroundAnimation, include the full @keyframes CSS rule
6. Choose animations that match the mood (playful = bounce, professional = fade, etc.)
7. Output ONLY the JSON, no explanations or markdown`;
}

/**
 * Simple template for users to copy directly
 */
export const SIMPLE_TEMPLATE = `I need a theme for my quiz game. Please create the JSON code for me.

My quiz topic is: _______________ (e.g., "Christmas Trivia", "Science Quiz", "Movie Night")

I want the mood/feeling to be: _______________ (e.g., fun and playful, professional, spooky, festive, futuristic)

My preferred colors are: _______________ (e.g., blues and greens, warm sunset colors, neon, or leave blank)

Background animation I'd like: _______________ (e.g., falling snow, twinkling stars, floating bubbles, none)

Celebration effect when answers are correct: _______________ (e.g., confetti, sparkles, fireworks, simple glow)

Please generate valid JSON theme code that I can paste into my quiz app.`;

/**
 * Example prompts for different themes
 */
export const EXAMPLE_PROMPTS = [
  {
    name: "Christmas Party",
    answers: {
      topic: "Christmas Trivia",
      mood: "festive and jolly",
      colors: "red and green with gold accents",
      backgroundAnimation: "falling snow",
      celebration: "sparkles",
    },
  },
  {
    name: "Space Adventure",
    answers: {
      topic: "Space and Astronomy",
      mood: "mysterious and awe-inspiring",
      colors: "deep purples and blues with starlight accents",
      backgroundAnimation: "twinkling stars",
      celebration: "fireworks",
    },
  },
  {
    name: "Ocean Discovery",
    answers: {
      topic: "Marine Life",
      mood: "calm and educational",
      colors: "ocean blues and teals",
      backgroundAnimation: "floating bubbles",
      celebration: "glow",
    },
  },
  {
    name: "80s Arcade",
    answers: {
      topic: "80s Pop Culture",
      mood: "retro and energetic",
      colors: "neon pink, cyan, and yellow",
      backgroundAnimation: "geometric shapes",
      celebration: "confetti",
    },
  },
];
