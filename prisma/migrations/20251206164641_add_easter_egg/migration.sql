-- CreateTable
CREATE TABLE "EasterEggClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EasterEggClick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EasterEggClick_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "hostNotes" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'SINGLE_SELECT',
    "timeLimit" INTEGER NOT NULL DEFAULT 30,
    "points" INTEGER NOT NULL DEFAULT 100,
    "orderIndex" INTEGER NOT NULL,
    "easterEggEnabled" BOOLEAN NOT NULL DEFAULT false,
    "easterEggButtonText" TEXT,
    "easterEggUrl" TEXT,
    "easterEggDisablesScoring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "hostNotes", "id", "imageUrl", "orderIndex", "points", "questionText", "questionType", "quizId", "timeLimit", "updatedAt") SELECT "createdAt", "hostNotes", "id", "imageUrl", "orderIndex", "points", "questionText", "questionType", "quizId", "timeLimit", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EasterEggClick_playerId_idx" ON "EasterEggClick"("playerId");

-- CreateIndex
CREATE INDEX "EasterEggClick_questionId_idx" ON "EasterEggClick"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "EasterEggClick_playerId_questionId_key" ON "EasterEggClick"("playerId", "questionId");
