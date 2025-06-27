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
CREATE TABLE "exchange_rates_daily" (
    "idx" SERIAL NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "open_rate" DECIMAL(20,8) NOT NULL,
    "high_rate" DECIMAL(20,8) NOT NULL,
    "low_rate" DECIMAL(20,8) NOT NULL,
    "close_rate" DECIMAL(20,8) NOT NULL,
    "avg_rate" DECIMAL(20,8) NOT NULL,
    "rate_count" INTEGER NOT NULL,
    "ohlc_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_daily_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "notifications" (
    "idx" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_idx" INTEGER NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notification_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("idx")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "idx" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_idx" INTEGER NOT NULL,
    "device_token" TEXT NOT NULL,
    "device_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("idx")
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
CREATE TABLE "notifications_histories" (
    "notification_idx" UUID NOT NULL,
    "user_idx" INTEGER NOT NULL,
    "triggered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_to_user" BOOLEAN NOT NULL DEFAULT false,
    "sent_to_fcm" BOOLEAN NOT NULL DEFAULT false,
    "fcm_response" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "notifications_histories_pkey" PRIMARY KEY ("notification_idx","user_idx","triggered_at")
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
CREATE TABLE "exchange_rates_raw" (
    "idx" SERIAL NOT NULL,
    "base_currency" CHAR(3) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_raw_pkey" PRIMARY KEY ("idx")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_social_unique" ON "users"("social_provider", "social_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_exchange_rates_lookup" ON "exchange_rates_daily"("currency_code", "base_currency", "ohlc_date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_daily_unique" ON "exchange_rates_daily"("currency_code", "base_currency", "ohlc_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_idx_device_token_key" ON "user_devices"("user_idx", "device_token");

-- CreateIndex
CREATE INDEX "idx_news_currency" ON "news"("currency_code");

-- CreateIndex
CREATE INDEX "idx_news_published" ON "news"("published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "news_source_url_unique" ON "news"("source_url", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_notifications_histories_notifications" ON "notifications_histories"("notification_idx");

-- CreateIndex
CREATE INDEX "idx_watchlist_user" ON "watchlist"("user_idx", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_unique_currency" ON "watchlist"("user_idx", "currency_code", "base_currency");

-- CreateIndex
CREATE INDEX "idx_exchange_rates_latest" ON "exchange_rates_raw"("currency_code", "base_currency", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_idx_fkey" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_idx_fkey" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications_histories" ADD CONSTRAINT "notifications_histories_notification_idx_fkey" FOREIGN KEY ("notification_idx") REFERENCES "notifications"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications_histories" ADD CONSTRAINT "notifications_histories_user_idx_fkey" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "fk_users_to_watchlist" FOREIGN KEY ("user_idx") REFERENCES "users"("idx") ON DELETE CASCADE ON UPDATE NO ACTION;
