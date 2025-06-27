import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { DateUtilService } from '../../common/utils/date-util/date-util.service';
import { ExchangeRateService } from '../exchange-rate/services/exchange-rate.service';
import { LockManagerService } from '../../infrastructure/redis/lock-manager.service';

@Injectable()
export class ScheduleManagerService {
  constructor(
    private readonly loggerService: CustomLoggerService,
    private readonly dateUtilService: DateUtilService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly lockManagerService: LockManagerService,
  ) {
    this.loggerService.context = ScheduleManagerService.name;
  }

  /**
   * 하루동안의 수집된 환율 데이터를 집계합니다
   * 매일 00:05에 실행 (외부 API가 당일 데이터 준비 완료 후)
   */
  @Cron('5 0 * * *')
  async runDailyAggregation() {
    await this.lockManagerService.runWithLock('daily-aggregation', async () => {
      try {
        const today = new Date();
        const yesterday = this.dateUtilService.getYesterday(today);

        // 어제 날짜의 종가 데이터를 오늘 00:05에 수집
        await this.exchangeRateService.calculateDailyRates(yesterday, yesterday);

        this.loggerService.info('Successfully collected daily rates');
      } catch (error) {
        this.loggerService.error('Failed to aggregate daily rates');
      }
    });
  }

  /**
   * AI 일일 환율 브리핑
   */
  @Cron('0 9 * * 1-5')
  async runDailyAIBriefing() {}

  // 환율 관련 뉴스 수집
  async runDailyRateNewsAggregation() {}

  // 알림 백업 체크
}
