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
  subDate(amount: number, dateType: ManipulateType): Date {
    return dayjs(new Date()).subtract(amount, dateType).toDate();
  }
}
