-- AlterTable
ALTER TABLE "Player" ADD COLUMN "languageCode" TEXT DEFAULT 'en';

-- CreateTable
CREATE TABLE "QuestionTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "hostNotes" TEXT,
    "hint" TEXT,
    "easterEggButtonText" TEXT,
    "isAutoTranslated" BOOLEAN NOT NULL DEFAULT true,
    "translatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnswerTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "isAutoTranslated" BOOLEAN NOT NULL DEFAULT true,
    "translatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnswerTranslation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuestionTranslation_questionId_idx" ON "QuestionTranslation"("questionId");

-- CreateIndex
CREATE INDEX "QuestionTranslation_languageCode_idx" ON "QuestionTranslation"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTranslation_questionId_languageCode_key" ON "QuestionTranslation"("questionId", "languageCode");

-- CreateIndex
CREATE INDEX "AnswerTranslation_answerId_idx" ON "AnswerTranslation"("answerId");

-- CreateIndex
CREATE INDEX "AnswerTranslation_languageCode_idx" ON "AnswerTranslation"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerTranslation_answerId_languageCode_key" ON "AnswerTranslation"("answerId", "languageCode");
