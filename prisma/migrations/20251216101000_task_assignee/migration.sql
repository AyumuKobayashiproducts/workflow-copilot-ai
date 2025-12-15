-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedToUserId" TEXT;

-- Backfill: existing tasks are assigned to their creator.
UPDATE "Task" SET "assignedToUserId" = "userId" WHERE "assignedToUserId" IS NULL;

-- Make required
ALTER TABLE "Task" ALTER COLUMN "assignedToUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Task_workspaceId_assignedToUserId_status_idx" ON "Task"("workspaceId", "assignedToUserId", "status");
CREATE INDEX "Task_workspaceId_assignedToUserId_createdAt_idx" ON "Task"("workspaceId", "assignedToUserId", "createdAt");
CREATE INDEX "Task_workspaceId_assignedToUserId_focusAt_idx" ON "Task"("workspaceId", "assignedToUserId", "focusAt");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


