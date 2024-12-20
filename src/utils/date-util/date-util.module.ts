import { Module } from '@nestjs/common';
import { DateUtilService } from './date-util.service';

@Module({
  providers: [DateUtilService],
})
export class DateUtilModule {}
