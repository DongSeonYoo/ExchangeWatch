import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

@Injectable()
export class DateUtilService {
  /**
   * 특정 날짜의 시작을 가져옵니다.
   * @param date 시작을 가져오고 싶은 날짜
   * @default date 오늘 날짜
   *
   * @return ISO datestring for prisma
   *
   */
  getBeginningOfDate(date: Date = new Date()): Date {
    const dateString = dayjs(date).format('YYYY-MM-DD').concat('T00:00:00Z');

    return this.stringToUtcDate(dateString);
  }

  /**
   * 특정 날짜의 다음 날의 시작을 가져옵니다.
   * @param date 시작을 가져오고 싶은 날짜
   * @default date 오늘 날짜
   *
   * @returns ISO datestring for prisma
   */
  getBeginningOfDateTommorw(date: Date = new Date()): Date {
    const dateSTring = dayjs(date)
      .add(1, 'day')
      .format('YYYY-MM-DD')
      .concat('T00:00:00Z');

    return this.stringToUtcDate(dateSTring);
  }

  /**
   * ISO datestring을 Date로 변환합니다.
   *
   * @param dateString ISO datestring
   * @returns Date
   */
  private stringToUtcDate(dateString: string): Date {
    return dayjs(dateString).toDate();
  }

  /**
   * 받은 날짜에 특정 기간 (일)을 더합니다.
   */
  addDays(date: Date, days: number): Date {
    return dayjs(date).add(days, 'day').toDate();
  }
}
