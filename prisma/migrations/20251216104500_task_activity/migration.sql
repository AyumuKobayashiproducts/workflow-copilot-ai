-- CreateEnum
CREATE TYPE "TaskActivityKind" AS ENUM (
  'comment',
  'created',
  'title_updated',
  'status_toggled',
  'assigned',
  'focus_set',
  'focus_cleared',
  'deleted'
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "kind" "TaskActivityKind" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskActivity_workspaceId_taskId_createdAt_idx" ON "TaskActivity"("workspaceId", "taskId", "createdAt");
CREATE INDEX "TaskActivity_workspaceId_actorUserId_createdAt_idx" ON "TaskActivity"("workspaceId", "actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


