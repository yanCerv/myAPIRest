-- CreateEnum
CREATE TYPE "AccountActionPurpose" AS ENUM ('RESET_PASSWORD', 'RESTORE_ACCOUNT');

-- CreateTable
CREATE TABLE "account_action_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "AccountActionPurpose" NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_action_tokens_user_id_purpose_idx" ON "account_action_tokens"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "account_action_tokens_expires_at_idx" ON "account_action_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "account_action_tokens" ADD CONSTRAINT "account_action_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
