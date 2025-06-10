import { Injectable } from '@nestjs/common';
import dayjs, { ManipulateType } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Provides date manipulation method using by dayjs
 *
 * Implemented as an injectable (declared global module) service to support unit testing through dependency injection.
 */
@Injectable()
export class DateUtilService {
  /**
   * Subtracts a specified amount of time from the current date
   */
  subDate(
    amount: number,
    dateType: ManipulateType,
    date: Date = new Date(),
  ): Date {
    return dayjs(date).subtract(amount, dateType).toDate();
  }

  /**
   * Get yesterday's date
   *
   * @returns date data converted YYYY-MM-DD
   */
  getYesterday(day: Date = new Date()): Date {
    return dayjs(day).subtract(1, 'day').toDate();
  }

  /**
   * Create date array between both date
   * @param startedAt start date
   * @param endedAt end date
   */
  getDatesBetween(startedAt: Date, endedAt: Date): Date[] {
    const dates: Date[] = [];
    let currentDate = dayjs(startedAt);
    const lastDate = dayjs(endedAt);

    while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate)) {
      dates.push(new Date(currentDate.toISOString().split('T')[0]));
      currentDate = currentDate.add(1, 'day');
    }

    return dates;
  }

  isBefore(targetDate1: Date, targetDate2: Date): boolean {
    return dayjs(targetDate1).isBefore(targetDate2);
  }

  /**
   * 새로운 거래일인지 UTC기준으로 확인
   *
   * @param currentTimestamp 현재 타임스탬프
   * @param prevTimestamp 이전 타임스탬프
   */
  isNewTradingDay(currentTimestamp: number, prevTimestamp: number): boolean {
    const currentDate = dayjs.utc(currentTimestamp).format('DD/MM/YYYY');
    const prevDate = dayjs.utc(prevTimestamp).format('DD/MM/YYYY');

    return currentDate !== prevDate;
  }

  /**
   * FX시장이 열려있는지 확인
   *
   * @returns 열려있으면 true, 닫혀있으면 false
   */
  isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

    return day >= 1 && day <= 5; // 월(1) ~ 금(5)만 열림
  }

  /**
   * 마지막으로 시장이 열렸던 날짜 반환 (UTC 기준)
   * - 월요일이면 금요일 (3일 전)
   * - 일요일이면 금요일 (2일 전)
   * - 토요일이면 금요일 (1일 전)
   * - 나머지는 하루 전
   */
  getLastMarketDay(): Date {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

    let offset = 1;
    if (day === 0) {
      // Sunday
      offset = 2;
    } else if (day === 1) {
      // Monday
      offset = 3;
    }

    const lastMarketDay = new Date(now);
    lastMarketDay.setUTCDate(now.getUTCDate() - offset);

    return dayjs(dayjs(lastMarketDay).format('YYYY-MM-DD')).toDate();
  }
}
