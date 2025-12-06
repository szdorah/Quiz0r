-- AlterTable
ALTER TABLE "Question" ADD COLUMN "hint" TEXT;

-- CreateTable
CREATE TABLE "PowerUpUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "powerUpType" TEXT NOT NULL,
    "copiedPlayerId" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PowerUpUsage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PowerUpUsage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "autoAdmit" BOOLEAN NOT NULL DEFAULT true,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "copyAnswerCount" INTEGER NOT NULL DEFAULT 0,
    "doublePointsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Quiz" ("autoAdmit", "createdAt", "description", "id", "isActive", "theme", "title", "updatedAt") SELECT "autoAdmit", "createdAt", "description", "id", "isActive", "theme", "title", "updatedAt" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PowerUpUsage_playerId_idx" ON "PowerUpUsage"("playerId");

-- CreateIndex
CREATE INDEX "PowerUpUsage_questionId_idx" ON "PowerUpUsage"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PowerUpUsage_playerId_questionId_powerUpType_key" ON "PowerUpUsage"("playerId", "questionId", "powerUpType");
