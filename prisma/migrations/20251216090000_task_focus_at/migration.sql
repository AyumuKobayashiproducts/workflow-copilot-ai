-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "focusAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_userId_focusAt_idx" ON "Task"("userId", "focusAt");


