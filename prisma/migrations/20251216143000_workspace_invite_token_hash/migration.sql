-- Hash workspace invite tokens in DB (do not store raw tokens)
-- Requires pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "WorkspaceInvite" ADD COLUMN "tokenHash" TEXT;

UPDATE "WorkspaceInvite"
SET "tokenHash" = encode(digest("token", 'sha256'), 'hex')
WHERE "tokenHash" IS NULL;

ALTER TABLE "WorkspaceInvite" ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "WorkspaceInvite_tokenHash_key" ON "WorkspaceInvite"("tokenHash");

DROP INDEX IF EXISTS "WorkspaceInvite_token_key";
ALTER TABLE "WorkspaceInvite" DROP COLUMN "token";


