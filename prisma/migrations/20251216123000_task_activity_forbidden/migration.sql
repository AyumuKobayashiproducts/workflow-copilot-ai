-- AlterEnum
ALTER TYPE "TaskActivityKind" ADD VALUE 'forbidden';

-- AlterTable
ALTER TABLE "TaskActivity" ALTER COLUMN "taskId" DROP NOT NULL;


