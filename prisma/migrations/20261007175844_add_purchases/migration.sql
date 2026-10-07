-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('CONFIRMED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VISA', 'MASTERCARD', 'AMEX');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED');

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "booking_code" VARCHAR(32) NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'CONFIRMED',
    "movie_id" INTEGER NOT NULL,
    "movie_title" VARCHAR(500) NOT NULL,
    "movie_poster_path" VARCHAR(500),
    "movie_duration_minutes" INTEGER,
    "movie_genres" TEXT[],
    "showtime_id" VARCHAR(255) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "cinema" VARCHAR(255) NOT NULL,
    "auditorium" VARCHAR(255) NOT NULL,
    "screen_type" VARCHAR(255) NOT NULL,
    "buyer_first_name" VARCHAR(100) NOT NULL,
    "buyer_last_name" VARCHAR(100) NOT NULL,
    "buyer_email" VARCHAR(320) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_last4" VARCHAR(4) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'APPROVED',
    "total_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_seats" (
    "id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "showtime_id" VARCHAR(255) NOT NULL,
    "seat_id" VARCHAR(255) NOT NULL,
    "label" VARCHAR(32) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "price_cents" INTEGER NOT NULL,

    CONSTRAINT "purchase_seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchases_booking_code_key" ON "purchases"("booking_code");

-- CreateIndex
CREATE INDEX "purchases_user_id_created_at_idx" ON "purchases"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "purchases_showtime_id_idx" ON "purchases"("showtime_id");

-- CreateIndex
CREATE INDEX "purchase_seats_purchase_id_idx" ON "purchase_seats"("purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_seats_showtime_id_seat_id_key" ON "purchase_seats"("showtime_id", "seat_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_seats" ADD CONSTRAINT "purchase_seats_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
