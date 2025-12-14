-- CreateEnum
CREATE TYPE "AiUsageKind" AS ENUM ('breakdown', 'weekly');

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "AiUsageKind" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsage_userId_date_idx" ON "AiUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_userId_date_kind_key" ON "AiUsage"("userId", "date", "kind");

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


