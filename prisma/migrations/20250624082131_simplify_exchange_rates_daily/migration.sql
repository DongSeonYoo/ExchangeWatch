/*
  Warnings:

  - You are about to drop the column `avg_rate` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `close_rate` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `high_rate` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `low_rate` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `ohlc_date` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `open_rate` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - You are about to drop the column `rate_count` on the `exchange_rates_daily` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currency_code,base_currency,rate_date]` on the table `exchange_rates_daily` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rate` to the `exchange_rates_daily` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate_date` to the `exchange_rates_daily` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "exchange_rates_daily_unique";

-- DropIndex
DROP INDEX "idx_exchange_rates_lookup";

-- AlterTable
ALTER TABLE "exchange_rates_daily" DROP COLUMN "avg_rate",
DROP COLUMN "close_rate",
DROP COLUMN "high_rate",
DROP COLUMN "low_rate",
DROP COLUMN "ohlc_date",
DROP COLUMN "open_rate",
DROP COLUMN "rate_count",
ADD COLUMN     "rate" DECIMAL(20,8) NOT NULL,
ADD COLUMN     "rate_date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "idx_exchange_rates_lookup" ON "exchange_rates_daily"("currency_code", "base_currency", "rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_daily_unique" ON "exchange_rates_daily"("currency_code", "base_currency", "rate_date");
