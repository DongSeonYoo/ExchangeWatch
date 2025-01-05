/*
  Warnings:

  - You are about to drop the column `date` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currency_code,base_currency]` on the table `exchange_rates_daily` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "exchange_rates_daily_unique";

-- DropIndex
DROP INDEX "idx_exchange_rates_daily_lookup";

-- AlterTable
ALTER TABLE "exchange_rates_daily" DROP COLUMN "date";

-- CreateIndex
CREATE INDEX "idx_exchange_rates_lookup" ON "exchange_rates_daily"("currency_code", "base_currency");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_daily_unique" ON "exchange_rates_daily"("currency_code", "base_currency");
