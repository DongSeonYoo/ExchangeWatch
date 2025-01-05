-- CreateTable
CREATE TABLE "alert_histories" (
    "idx" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_idx" INTEGER NOT NULL,
    "alert_idx" UUID NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "triggered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_histories_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "idx" SERIAL NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "news" (
    "idx" SERIAL NOT NULL,
    "title" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "source_url" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "news_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "idx" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_idx" INTEGER NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "target_price" DECIMAL(20,8) NOT NULL,
    "condition" VARCHAR NOT NULL,
    "is_triggered" BOOLEAN NOT NULL DEFAULT false,
    "is_repeatable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "users" (
    "idx" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR NOT NULL,
    "password" CHAR(60),
    "social_provider" VARCHAR(20) NOT NULL,
    "social_id" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "idx" SERIAL NOT NULL,
    "user_idx" INTEGER NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("idx")
);

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
CREATE INDEX "idx_alert_histories_alert" ON "alert_histories"("alert_idx");

-- CreateIndex
CREATE INDEX "idx_exchange_rates_latest" ON "exchange_rates"("currency_code", "base_currency", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_news_currency" ON "news"("currency_code");

-- CreateIndex
CREATE INDEX "idx_news_published" ON "news"("published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "news_source_url_unique" ON "news"("source_url", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_price_alerts_user" ON "price_alerts"("user_idx", "currency_code", "base_currency");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_social_unique" ON "users"("social_provider", "social_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_watchlist_user" ON "watchlist"("user_idx", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_unique_currency" ON "watchlist"("user_idx", "currency_code", "base_currency");

-- CreateIndex
CREATE INDEX "idx_exchange_rates_daily_lookup" ON "exchange_rates_daily"("currency_code", "base_currency", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_daily_unique" ON "exchange_rates_daily"("currency_code", "base_currency", "date");

-- AddForeignKey
ALTER TABLE "alert_histories" ADD CONSTRAINT "fk_price_alerts_to_alert_histories" FOREIGN KEY ("alert_idx") REFERENCES "price_alerts"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_histories" ADD CONSTRAINT "fk_users_to_alert_histories" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "fk_users_to_price_alerts" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "fk_users_to_watchlist" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;
