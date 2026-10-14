-- CreateEnum
CREATE TYPE "OrderSessionStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderPaymentProvider" AS ENUM ('PAYPAL');

-- CreateTable
CREATE TABLE "order_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "OrderSessionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "payment_provider" "OrderPaymentProvider" NOT NULL,
    "paypal_order_id" VARCHAR(64),
    "showtime_id" VARCHAR(255) NOT NULL,
    "buyer_first_name" VARCHAR(100) NOT NULL,
    "buyer_last_name" VARCHAR(100) NOT NULL,
    "buyer_email" VARCHAR(320) NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_holds" (
    "id" UUID NOT NULL,
    "order_session_id" UUID NOT NULL,
    "showtime_id" VARCHAR(255) NOT NULL,
    "seat_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_holds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_sessions_paypal_order_id_key" ON "order_sessions"("paypal_order_id");

-- CreateIndex
CREATE INDEX "order_sessions_user_id_created_at_idx" ON "order_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "order_sessions_showtime_id_expires_at_idx" ON "order_sessions"("showtime_id", "expires_at");

-- CreateIndex
CREATE INDEX "order_sessions_status_expires_at_idx" ON "order_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "seat_holds_expires_at_idx" ON "seat_holds"("expires_at");

-- CreateIndex
CREATE INDEX "seat_holds_order_session_id_idx" ON "seat_holds"("order_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "seat_holds_showtime_id_seat_id_key" ON "seat_holds"("showtime_id", "seat_id");

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_order_session_id_fkey" FOREIGN KEY ("order_session_id") REFERENCES "order_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
