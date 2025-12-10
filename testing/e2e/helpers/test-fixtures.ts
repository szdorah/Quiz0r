/**
 * Test fixtures and sample data for Quiz0r E2E tests
 */

export const SAMPLE_QUIZZES = {
    basic: {
        title: "Basic Test Quiz",
        description: "A simple quiz for testing basic functionality",
        questions: [
            {
                questionText: "What is 2 + 2?",
                questionType: "SINGLE_SELECT" as const,
                timeLimit: 30,
                points: 100,
                answers: [
                    { answerText: "3", isCorrect: false },
                    { answerText: "4", isCorrect: true },
                    { answerText: "5", isCorrect: false },
                ],
            },
            {
                questionText: "Which are primary colors?",
                questionType: "MULTI_SELECT" as const,
                timeLimit: 30,
                points: 100,
                answers: [
                    { answerText: "Red", isCorrect: true },
                    { answerText: "Blue", isCorrect: true },
                    { answerText: "Green", isCorrect: false },
                    { answerText: "Yellow", isCorrect: true },
                ],
            },
        ],
    },

    withSections: {
        title: "Quiz with Sections",
        description: "Quiz containing section dividers",
        questions: [
            {
                questionText: "Math Section",
                questionType: "SECTION" as const,
                timeLimit: 0,
                points: 0,
                answers: [],
            },
            {
                questionText: "What is 10 x 10?",
                questionType: "SINGLE_SELECT" as const,
                timeLimit: 20,
                points: 100,
                answers: [
                    { answerText: "100", isCorrect: true },
                    { answerText: "110", isCorrect: false },
                    { answerText: "90", isCorrect: false },
                ],
            },
            {
                questionText: "Science Section",
                questionType: "SECTION" as const,
                timeLimit: 0,
                points: 0,
                answers: [],
            },
            {
                questionText: "What is H2O?",
                questionType: "SINGLE_SELECT" as const,
                timeLimit: 20,
                points: 100,
                answers: [
                    { answerText: "Water", isCorrect: true },
                    { answerText: "Hydrogen", isCorrect: false },
                    { answerText: "Oxygen", isCorrect: false },
                ],
            },
        ],
    },

    withHostNotes: {
        title: "Quiz with Host Notes",
        description: "Quiz containing host notes for testing",
        questions: [
            {
                questionText: "What is the capital of France?",
                questionType: "SINGLE_SELECT" as const,
                timeLimit: 30,
                points: 100,
                hostNotes: "This is an easy question to warm up the players",
                answers: [
                    { answerText: "London", isCorrect: false },
                    { answerText: "Paris", isCorrect: true },
                    { answerText: "Berlin", isCorrect: false },
                    { answerText: "Madrid", isCorrect: false },
                ],
            },
        ],
    },
};

export const SAMPLE_PLAYERS = [
    { name: "Alice", emoji: "😀" },
    { name: "Bob", emoji: "😎" },
    { name: "Charlie", emoji: "🤖" },
    { name: "Diana", emoji: "👾" },
    { name: "Eve", emoji: "🦊" },
    { name: "Frank", emoji: "🐱" },
    { name: "Grace", emoji: "🐶" },
    { name: "Henry", emoji: "🎮" },
    { name: "Iris", emoji: "🎯" },
    { name: "Jack", emoji: "⚡" },
];

export const SAMPLE_THEMES = {
    ocean: {
        name: "Ocean Theme",
        colors: {
            primary: "#0077be",
            secondary: "#00a8e8",
            background: "#001f3f",
            text: "#ffffff",
        },
    },
    sunset: {
        name: "Sunset Theme",
        colors: {
            primary: "#ff6b6b",
            secondary: "#feca57",
            background: "#2d3436",
            text: "#ffffff",
        },
    },
};

export const TRANSLATION_TEST_DATA = {
    spanish: {
        languageCode: "es",
        questions: [
            {
                questionText: "¿Cuál es la capital de España?",
                answers: [
                    { answerText: "Madrid", isCorrect: true },
                    { answerText: "Barcelona", isCorrect: false },
                    { answerText: "Valencia", isCorrect: false },
                ],
            },
        ],
    },
    french: {
        languageCode: "fr",
        questions: [
            {
                questionText: "Quelle est la capitale de la France?",
                answers: [
                    { answerText: "Paris", isCorrect: true },
                    { answerText: "Lyon", isCorrect: false },
                    { answerText: "Marseille", isCorrect: false },
                ],
            },
        ],
    },
};

export const POWER_UP_TEST_CONFIG = {
    hintQuestion: {
        questionText: "What is the largest planet in our solar system?",
        questionType: "SINGLE_SELECT" as const,
        timeLimit: 30,
        points: 100,
        hint: "It's named after the king of the Roman gods",
        answers: [
            { answerText: "Mars", isCorrect: false },
            { answerText: "Jupiter", isCorrect: true },
            { answerText: "Saturn", isCorrect: false },
            { answerText: "Neptune", isCorrect: false },
        ],
    },
};

export const EASTER_EGG_TEST_CONFIG = {
    questionText: "Find the hidden easter egg!",
    questionType: "SINGLE_SELECT" as const,
    timeLimit: 30,
    points: 100,
    easterEggEnabled: true,
    easterEggButtonText: "Click me!",
    easterEggUrl: "https://example.com/easter-egg",
    easterEggDisablesScoring: false,
    answers: [
        { answerText: "Option A", isCorrect: true },
        { answerText: "Option B", isCorrect: false },
    ],
};

/**
 * Helper to generate multiple similar questions for stress testing
 */
export function generateBulkQuestions(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        questionText: `Question ${i + 1}: What is ${i + 1} + ${i + 1}?`,
        questionType: "SINGLE_SELECT" as const,
        timeLimit: 20,
        points: 100,
        answers: [
            { answerText: `${(i + 1) * 2}`, isCorrect: true },
            { answerText: `${(i + 1) * 2 + 1}`, isCorrect: false },
            { answerText: `${(i + 1) * 2 - 1}`, isCorrect: false },
        ],
    }));
}

/**
 * Default test configuration values
 */
export const DEFAULT_TEST_CONFIG = {
    questionTimeLimit: 30,
    questionPoints: 100,
    playerCount: 3,
    maxPlayerCount: 10,
    socketTimeout: 10000,
    gameStartTimeout: 15000,
};
