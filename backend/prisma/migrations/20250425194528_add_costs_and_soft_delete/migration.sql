-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transcription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'plain',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fileSize" INTEGER,
    "duration" REAL,
    "processingTime" REAL,
    "characterCount" INTEGER,
    "wordCount" INTEGER,
    "tokenCount" INTEGER,
    "costUsd" REAL,
    "costBrl" REAL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Transcription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transcription" ("characterCount", "content", "createdAt", "duration", "fileSize", "id", "outputFormat", "processingTime", "title", "type", "updatedAt", "userId", "wordCount") SELECT "characterCount", "content", "createdAt", "duration", "fileSize", "id", "outputFormat", "processingTime", "title", "type", "updatedAt", "userId", "wordCount" FROM "Transcription";
DROP TABLE "Transcription";
ALTER TABLE "new_Transcription" RENAME TO "Transcription";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
