import { Injectable, Logger } from '@nestjs/common';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { Cron } from '@nestjs/schedule';
import { DateUtilService } from '../../../common/utils/date-util/date-util.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ExchangeRateScheduler {
  private readonly logger: Logger = new Logger(ExchangeRateScheduler.name);

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly dateUtilService: DateUtilService,
  ) {}

  /**
   * Aggregates daily exchange rate statistics at midnight (UTC)
   *
   * Process:
   * 1. Aggregates previous day's exchange rates (00:00 ~ 23:59)
   * 2. GET OHLC(Open, High, Low, Close) data
   * 3. Insert into exchange_rates_daily
   *
   * @throws {ExternalApiException} when external api errors
   * @throws {DatabaseException} When database operation fails
   */
  @Cron('5 0 * * *') // UTC 00:05 (임시 comment 잘못 돌아가면 폭탄맞습니다잉)
  async aggregateDailyRates() {
    try {
      const today = new Date();
      const yesterday = this.dateUtilService.getYesterday(today);

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
