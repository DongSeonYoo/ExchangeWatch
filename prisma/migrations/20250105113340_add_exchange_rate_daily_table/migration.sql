-- CreateTable
CREATE TABLE "exchange_rates_daily" (
    "idx" SERIAL NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "date" DATE NOT NULL,
    "open_rate" DECIMAL(20,8) NOT NULL,
    "high_rate" DECIMAL(20,8) NOT NULL,
    "low_rate" DECIMAL(20,8) NOT NULL,
    "close_rate" DECIMAL(20,8) NOT NULL,
    "avg_rate" DECIMAL(20,8) NOT NULL,
    "rate_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_daily_pkey" PRIMARY KEY ("idx")
);

-- CreateIndex
CREATE INDEX "idx_exchange_rates_daily_lookup" ON "exchange_rates_daily"("currency_code", "base_currency", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_daily_unique" ON "exchange_rates_daily"("currency_code", "base_currency", "date");
