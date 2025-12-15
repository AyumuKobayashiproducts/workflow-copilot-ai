-- Backfill IDs are generated with md5(random()) to avoid requiring DB extensions.

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'member');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 5,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultWorkspaceId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "WeeklyNote" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "workspaceId" TEXT;

-- Backfill: create a personal workspace per user and attach existing rows.
DO $$
DECLARE u RECORD;
DECLARE ws_id TEXT;
DECLARE m_id TEXT;
BEGIN
  FOR u IN SELECT "id" FROM "User" LOOP
    ws_id := 'ws_' || md5(random()::text || clock_timestamp()::text || u."id"::text);
    m_id := 'wsm_' || md5(random()::text || clock_timestamp()::text || u."id"::text);

    INSERT INTO "Workspace" ("id", "name", "createdAt", "updatedAt")
    VALUES (ws_id, 'Personal workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    INSERT INTO "WorkspaceMembership" ("id", "workspaceId", "userId", "role", "createdAt", "updatedAt")
    VALUES (m_id, ws_id, u."id", 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    UPDATE "User" SET "defaultWorkspaceId" = ws_id WHERE "id" = u."id";

    UPDATE "Task" SET "workspaceId" = ws_id WHERE "userId" = u."id";
    UPDATE "WeeklyNote" SET "workspaceId" = ws_id WHERE "userId" = u."id";
    UPDATE "WeeklyReport" SET "workspaceId" = ws_id WHERE "userId" = u."id";
    UPDATE "AiUsage" SET "workspaceId" = ws_id WHERE "userId" = u."id";
  END LOOP;
END $$;

-- Make columns required after backfill
ALTER TABLE "Task" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "WeeklyNote" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "WeeklyReport" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AiUsage" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Replace uniqueness constraints that should be workspace-aware
DROP INDEX IF EXISTS "WeeklyNote_userId_weekStart_key";
DROP INDEX IF EXISTS "WeeklyNote_userId_weekStart_idx";
DROP INDEX IF EXISTS "WeeklyReport_userId_weekStart_key";
DROP INDEX IF EXISTS "WeeklyReport_userId_weekStart_idx";
DROP INDEX IF EXISTS "AiUsage_userId_date_kind_key";
DROP INDEX IF EXISTS "AiUsage_userId_date_idx";
DROP INDEX IF EXISTS "Task_userId_status_idx";
DROP INDEX IF EXISTS "Task_userId_createdAt_idx";
DROP INDEX IF EXISTS "Task_userId_focusAt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");
CREATE UNIQUE INDEX "WorkspaceMembership_workspaceId_userId_key" ON "WorkspaceMembership"("workspaceId", "userId");
CREATE INDEX "WorkspaceMembership_userId_idx" ON "WorkspaceMembership"("userId");
CREATE INDEX "WorkspaceMembership_workspaceId_idx" ON "WorkspaceMembership"("workspaceId");
CREATE INDEX "WorkspaceInvite_workspaceId_idx" ON "WorkspaceInvite"("workspaceId");
CREATE INDEX "WorkspaceInvite_expiresAt_idx" ON "WorkspaceInvite"("expiresAt");

CREATE INDEX "Task_workspaceId_userId_status_idx" ON "Task"("workspaceId", "userId", "status");
CREATE INDEX "Task_workspaceId_userId_createdAt_idx" ON "Task"("workspaceId", "userId", "createdAt");
CREATE INDEX "Task_workspaceId_userId_focusAt_idx" ON "Task"("workspaceId", "userId", "focusAt");

CREATE INDEX "WeeklyNote_workspaceId_userId_weekStart_idx" ON "WeeklyNote"("workspaceId", "userId", "weekStart");
CREATE UNIQUE INDEX "WeeklyNote_workspaceId_userId_weekStart_key" ON "WeeklyNote"("workspaceId", "userId", "weekStart");

CREATE INDEX "WeeklyReport_workspaceId_userId_weekStart_idx" ON "WeeklyReport"("workspaceId", "userId", "weekStart");
CREATE UNIQUE INDEX "WeeklyReport_workspaceId_userId_weekStart_key" ON "WeeklyReport"("workspaceId", "userId", "weekStart");

CREATE INDEX "AiUsage_workspaceId_userId_date_idx" ON "AiUsage"("workspaceId", "userId", "date");
CREATE UNIQUE INDEX "AiUsage_workspaceId_userId_date_kind_key" ON "AiUsage"("workspaceId", "userId", "date", "kind");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultWorkspaceId_fkey" FOREIGN KEY ("defaultWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyNote" ADD CONSTRAINT "WeeklyNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;


