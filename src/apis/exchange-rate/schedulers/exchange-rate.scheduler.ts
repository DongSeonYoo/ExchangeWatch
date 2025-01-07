import { Injectable, Logger } from '@nestjs/common';
import { ExchangeRateService } from '../exchange-rate.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExchageRateScheduler {
  private readonly logger: Logger = new Logger(ExchageRateScheduler.name);

  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * Collects real-time currency rate data every 10 minutes
   *
   * Process:
   * 1. Collect latest exchange rates from Fixer API
   * 2. Save to the RDB (PostgreSQL)
   * 3. Update Redis Cache
   *
   * @throws {FixerAPIException} When API call fails
   * @throws {DatabaseException} When database operation fails
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async aggregateLatestRates() {
    try {
      await this.exchangeRateService.saveLatestRates();

      this.logger.log('Successfully collected latest rates');
    } catch (error) {
      this.logger.error('Failed to aggregate daily rates', error);
    }
  }

  /**
   * Aggregates daily exchange rate statistics at midnight (UTC)
   *
   * Process:
   * 1. Aggregates previous day's exchange rates (00:00 ~ 23:59)
   * 2. Calculates OHLC (Open, High, Low, Close)
   * 3. Stores daily statistics in exchange_rates_daily
   *
   * @throws {DatabaseException} When database operation fails
   */
  @Cron('5 0 * * *') // UTC 00:05
  async aggregateDailyRates() {
    try {
      this.logger.log('Successfully collected daily rates');
    } catch (error) {
      this.logger.error('Failed to aggregate daily rates', error);
    }
  }
}
