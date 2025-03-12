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
   * Add a specified amount of time from the current date
   */
  addDate(amount: number, dateType: ManipulateType): Date {
    return this.subDate(-amount, dateType);
  }

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
  getDatesBeetween(startedAt: Date, endedAt: Date): Date[] {
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
}
