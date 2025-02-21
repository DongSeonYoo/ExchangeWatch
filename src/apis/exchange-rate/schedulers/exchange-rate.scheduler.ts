import { Injectable, Logger } from '@nestjs/common';
import { ExchangeRateService } from '../exchange-rate.service';
import { Cron } from '@nestjs/schedule';
import { DateUtilService } from '../../../utils/date-util/date-util.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ExchageRateScheduler {
  private readonly logger: Logger = new Logger(ExchageRateScheduler.name);

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly dateUtilService: DateUtilService,
  ) {}

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
  @Cron('1 0 * * *')
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
      const yesterday = this.dateUtilService.getYesterday(today);
      const today = new Date();

      await this.exchangeRateService.calculateDailyRates(yesterday, today);

      this.logger.log('Successfully collected daily rates');
    } catch (error) {
      this.logger.error('Failed to aggregate daily rates');

      // If already has currency-pair on same date
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(error);
        // TODO: Add more way to respond that error
      }
    }
  }
}
