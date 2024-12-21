/*
  Warnings:

  - Made the column `social_provider` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `social_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "social_provider" SET NOT NULL,
ALTER COLUMN "social_id" SET NOT NULL;
