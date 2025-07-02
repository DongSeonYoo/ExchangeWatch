-- AlterTable
ALTER TABLE "news" ADD COLUMN     "emotion_score" DOUBLE PRECISION,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "mentioned_currencies" TEXT[];

-- CreateIndex
CREATE INDEX "idx_news_keywords" ON "news"("keywords");

-- CreateIndex
CREATE INDEX "idx_news_mentioned_currencies" ON "news"("mentioned_currencies");
