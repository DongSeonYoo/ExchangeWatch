import { Injectable } from '@nestjs/common';
import dayjs, { ManipulateType } from 'dayjs';

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
   * FX시장이 열려있는지 확인
   *
   * @returns 열려있으면 true, 닫혀있으면 false
   */
  isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = sunday, 5 = friday
    const hour = now.getUTCHours();

    return !(
      (day === 5 && hour >= 21) || // 금요일 21시 이후
      day === 6 || // 토요일 하루 종일
      (day === 0 && hour < 21) // 일요일 21시 이전
    );
  }
}
