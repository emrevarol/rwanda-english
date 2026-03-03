-- CreateTable
CREATE TABLE "DailyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "task1Type" TEXT NOT NULL,
    "task1Done" BOOLEAN NOT NULL DEFAULT false,
    "task2Type" TEXT NOT NULL,
    "task2Done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyProgress_userId_date_key" ON "DailyProgress"("userId", "date");
