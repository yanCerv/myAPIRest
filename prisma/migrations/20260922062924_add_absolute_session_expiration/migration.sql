/*
  Warnings:

  - Added the required column `absolute_expires_at` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "absolute_expires_at" TIMESTAMP(3) NOT NULL;
