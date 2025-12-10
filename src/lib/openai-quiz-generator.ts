import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { fetchUnsplashImages } from "@/lib/unsplash";

export interface QuizGenerationOptions {
  topic: string;
  difficulty: string;
  questionCount: number;
  sectionCount: number;
  additionalNotes?: string;
}

interface AIAnswer {
  answerText: string;
  isCorrect?: boolean;
  imageUrl?: string | null;
}

interface AIQuestion {
  questionText?: string;
  questionType?: string;
  hint?: string | null;
  hostNotes?: string | null;
  imageUrl?: string | null;
  timeLimit?: number;
  points?: number;
  answers?: AIAnswer[];
}

interface AISection {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  questions?: AIQuestion[];
}

interface AIQuizResponse {
  title?: string;
  description?: string | null;
  sections?: AISection[];
  questions?: AIQuestion[];
}

interface NormalizedAnswer {
  answerText: string;
  isCorrect: boolean;
  imageUrl: string | null;
}

interface NormalizedQuestion {
  questionText: string;
  questionType: "SINGLE_SELECT" | "MULTI_SELECT" | "SECTION";
  hint: string | null;
  hostNotes: string | null;
  imageUrl: string | null;
  timeLimit: number;
  points: number;
  answers: NormalizedAnswer[];
}

async function getOpenAIClient(): Promise<OpenAI | null> {
  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "openai_api_key" },
  });

  if (!apiKeySetting?.value) {
    return null;
  }

  return new OpenAI({
    apiKey: apiKeySetting.value,
  });
}

function normalizeQuestionType(type?: string): NormalizedQuestion["questionType"] {
  const normalized = type?.toUpperCase();
  if (normalized === "MULTI_SELECT") return "MULTI_SELECT";
  if (normalized === "SECTION") return "SECTION";
  return "SINGLE_SELECT";
}

function normalizeAnswers(
  rawAnswers: AIAnswer[] | undefined,
  questionType: NormalizedQuestion["questionType"]
): NormalizedAnswer[] {
  if (questionType === "SECTION") return [];

  const answers: NormalizedAnswer[] = (rawAnswers || [])
    .filter((a) => a.answerText?.trim())
    .map((answer, index) => ({
      answerText: answer.answerText!.trim(),
      imageUrl: answer.imageUrl?.trim?.() || null,
      isCorrect:
        answer.isCorrect !== undefined
          ? Boolean(answer.isCorrect)
          : index === 0, // default first answer to correct if missing
    }))
    .slice(0, 6); // keep things concise

  // Ensure minimum answer set
  while (answers.length < 2) {
    answers.push({
      answerText: answers.length === 0 ? "Check the facts" : "Double-check this option",
      isCorrect: answers.length === 0,
      imageUrl: null,
    });
  }

  // Ensure at least one correct and one incorrect
  const hasCorrect = answers.some((a) => a.isCorrect);
  if (!hasCorrect) {
    answers[0].isCorrect = true;
  }
  const hasIncorrect = answers.some((a) => !a.isCorrect);
  if (!hasIncorrect) {
    answers[answers.length - 1].isCorrect = false;
  }

  // Single select should only have one correct answer
  if (questionType === "SINGLE_SELECT") {
    let madeFirstCorrect = false;
    for (const answer of answers) {
      if (answer.isCorrect && !madeFirstCorrect) {
        madeFirstCorrect = true;
      } else {
        answer.isCorrect = false;
      }
    }
    if (!madeFirstCorrect) {
      answers[0].isCorrect = true;
    }
  }

  // Randomize order to avoid always placing the correct answer first
  for (let i = answers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return answers;
}

function normalizeQuestion(question: AIQuestion): NormalizedQuestion {
  const questionType = normalizeQuestionType(question.questionType);
  const answers = normalizeAnswers(question.answers, questionType);

  return {
    questionText:
      question.questionText?.trim() ||
      "Review this AI generated question before publishing",
    questionType,
    hint: questionType === "SECTION" ? null : question.hint?.trim() || null,
    hostNotes: question.hostNotes?.trim() || null,
    imageUrl: question.imageUrl?.trim?.() || null,
    timeLimit:
      questionType === "SECTION"
        ? 0
        : Math.min(90, Math.max(15, question.timeLimit ?? 30)),
    points: questionType === "SECTION" ? 0 : Math.max(50, question.points ?? 100),
    answers,
  };
}

function buildPrompt(options: QuizGenerationOptions, targetQuestionCount: number) {
  const safeTopic = options.topic.trim() || "General Knowledge";
  const notes = options.additionalNotes?.trim();
  const sectionCount = Math.max(0, options.sectionCount);

  return `You are an experienced quiz master. Create a fully-written trivia quiz in ENGLISH ONLY (UK English).

Quiz requirements:
- Theme: ${safeTopic}
- Difficulty: ${options.difficulty || "medium"}
- Total playable questions: ${targetQuestionCount} (do NOT count section headers)
- Number of sections/groups: ${sectionCount} (each must have a short title/description and at least one question)
- Use engaging, concise wording suitable for a live host to read aloud.
- Include a mix of SINGLE_SELECT (one correct answer) and MULTI_SELECT (2+ correct answers where it makes sense).
- Always provide: questionText, hint, hostNotes, answers (answerText + isCorrect flag), timeLimit (seconds between 15-90), and points (50-200) for each playable question.
- Provide helpful imageUrl values using reliable, license-friendly links (e.g., images.unsplash.com). Aim for every section AND at least half of the questions to include an image where it fits.
- Keep everything in English and avoid markdown/code fences.
- Answers must always include at least one correct and one incorrect option with clear wording.

${notes ? `Extra guidance from the host: ${notes}` : "No extra host guidance provided."}

Return JSON ONLY with this exact shape:
{
  "title": "Quiz title",
  "description": "Short description",
  "sections": [
    {
      "title": "Section title",
      "description": "What this section covers",
      "imageUrl": "optional image",
      "questions": [ /* questions for this section */ ]
    }
  ],
  "questions": [ /* additional questions not tied to a section (optional) */ ]
}

Remember: keep to the requested counts, keep it English-only, and do not add explanations.`;
}

function collectQuestionsFromSections(
  sections: AISection[] | undefined,
  fallbackQuestions: AIQuestion[],
  desiredQuestionCount: number,
  sectionLimit: number,
  topic: string
): NormalizedQuestion[] {
  const normalized: NormalizedQuestion[] = [];
  const allSections = sections || [];
  const limitedSections =
    sectionLimit === 0
      ? []
      : allSections.slice(0, Math.max(0, sectionLimit));
  const extraSectionQuestions =
    sectionLimit === 0
      ? allSections.flatMap((section) => section.questions || [])
      : [];
  const totalSlots = desiredQuestionCount + Math.max(0, sectionLimit);

  let playableCount = 0;
  let sectionCount = 0;

  for (const section of limitedSections) {
    if (normalized.length >= totalSlots) break;
    const sectionTitle = section.title?.trim() || "Section";
    normalized.push({
      questionText: sectionTitle,
      questionType: "SECTION",
      hint: null,
      hostNotes: section.description?.trim() || null,
      imageUrl: section.imageUrl?.trim?.() || null,
      timeLimit: 0,
      points: 0,
      answers: [],
    });
    sectionCount += 1;

    for (const question of section.questions || []) {
      if (playableCount >= desiredQuestionCount || normalized.length >= totalSlots) {
        break;
      }
      normalized.push(normalizeQuestion(question));
      playableCount += 1;
    }
  }

  // Use any remaining top-level questions to reach the desired count
  const combinedFallback = [...fallbackQuestions, ...extraSectionQuestions];
  for (const question of combinedFallback) {
    if (playableCount >= desiredQuestionCount || normalized.length >= totalSlots) {
      break;
    }
    normalized.push(normalizeQuestion(question));
    playableCount += 1;
  }

  // Add placeholder sections if AI returned fewer than requested
  while (sectionCount < sectionLimit && normalized.length < totalSlots) {
    sectionCount += 1;
    normalized.push({
      questionText: `Section ${sectionCount}: ${topic || "Quiz topic"}`,
      questionType: "SECTION",
      hint: null,
      hostNotes: "Added automatically. Adjust the intro, add image, and ensure questions align.",
      imageUrl: null,
      timeLimit: 0,
      points: 0,
      answers: [],
    });
  }

  // If we still don't have enough questions, pad with simple placeholders
  while (playableCount < desiredQuestionCount && normalized.length < totalSlots) {
    normalized.push(
      normalizeQuestion({
        questionText: `Review this ${topic} question before using live`,
        questionType: "SINGLE_SELECT",
        answers: [
          { answerText: "Likely correct", isCorrect: true },
          { answerText: "Probably incorrect", isCorrect: false },
        ],
        hint: "Confirm correctness before using live",
        hostNotes: "AI could not supply enough unique questions.",
        timeLimit: 30,
        points: 100,
      })
    );
    playableCount += 1;
  }

  return normalized.slice(0, totalSlots);
}

async function addImagesToContent(
  questions: NormalizedQuestion[],
  topic: string,
  unsplashAccessKey: string | null
): Promise<NormalizedQuestion[]> {
  const enriched: NormalizedQuestion[] = questions.map((q) => ({ ...q }));
  const unsplashImages =
    unsplashAccessKey && questions.length > 0
      ? await fetchUnsplashImages(topic, Math.max(questions.length, 8), unsplashAccessKey)
      : [];
  // Fixed direct Unsplash URLs (no redirects) for reliability
  const sectionImages = [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80",
  ];
  const questionImages = [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
  ];

  const makeSectionImage = (index: number) =>
    unsplashImages.shift() ||
    sectionImages[(index - 1) % sectionImages.length];
  const makeQuestionImage = () =>
    unsplashImages.shift() ||
    questionImages[(Math.floor(Math.random() * questionImages.length))];

  // Ensure all sections have an image
  let sectionIndex = 0;
  for (const question of enriched) {
    if (question.questionType === "SECTION" && !question.imageUrl) {
      sectionIndex += 1;
      question.imageUrl = makeSectionImage(sectionIndex);
    }
  }

  const playable = enriched.filter((q) => q.questionType !== "SECTION");
  const missingImage = playable.filter((q) => !q.imageUrl);
  // Aim to cover all playable questions with an image when available
  const targetWithImages = playable.length;

  let added = 0;
  for (const question of missingImage) {
    if (added >= targetWithImages) break;
    added += 1;
    question.imageUrl = makeQuestionImage();
  }

  return enriched;
}

export async function generateQuizWithAI(options: QuizGenerationOptions) {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const questionCount = Math.min(Math.max(options.questionCount, 3), 25);
  const sectionCount = Math.min(Math.max(options.sectionCount, 0), questionCount);
  const topic = options.topic.trim() || "General Knowledge";
  const difficulty = options.difficulty || "medium";

  const prompt = buildPrompt(
    { ...options, sectionCount, topic, difficulty },
    questionCount
  );

  // Load Unsplash access key if configured
  const unsplashSetting = await prisma.setting.findUnique({
    where: { key: "unsplash_api_key" },
  });
  const unsplashAccessKey = unsplashSetting?.value || null;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content:
          "You generate structured quiz JSON for a trivia game. Always respond with strict JSON and keep every string in English (UK).",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error("No response from OpenAI");
  }

  let parsed: AIQuizResponse;
  try {
    parsed = JSON.parse(responseText) as AIQuizResponse;
  } catch (err) {
    console.error("Failed to parse AI quiz response", err);
    throw new Error("Failed to parse AI response");
  }

  const normalizedQuestions = await addImagesToContent(
    collectQuestionsFromSections(
      parsed.sections,
      parsed.questions || [],
      questionCount,
      sectionCount,
      topic
    ),
    topic,
    unsplashAccessKey
  );

  const playableQuestions = normalizedQuestions.filter(
    (q) => q.questionType !== "SECTION"
  );

  const quizTitle =
    parsed.title?.trim() ||
    `${topic || "AI"} Quiz (${difficulty})`;

  const quizDescription =
    parsed.description?.trim() ||
    "Draft created with AI. Review carefully before hosting.";

  // Persist quiz with questions
  const quiz = await prisma.quiz.create({
    data: {
      title: quizTitle,
      description: quizDescription,
      aiGenerated: true,
      questions: {
        create: normalizedQuestions.map((question, index) => ({
          questionText: question.questionText,
          imageUrl: question.imageUrl,
          hostNotes: question.hostNotes,
          questionType: question.questionType,
          timeLimit: question.timeLimit,
          points: question.points,
          orderIndex: index,
          hint: question.hint,
          answers:
            question.questionType === "SECTION"
              ? undefined
              : {
                  create: question.answers.map((answer, answerIndex) => ({
                    answerText: answer.answerText,
                    imageUrl: answer.imageUrl,
                    isCorrect: answer.isCorrect,
                    orderIndex: answerIndex,
                  })),
                },
        })),
      },
    },
  });

  return {
    quizId: quiz.id,
    quizTitle: quiz.title,
    questionCount: playableQuestions.length,
  };
}
