import { Global, Module } from '@nestjs/common';
import { DateUtilService } from './date-util.service';

@Global()
@Module({
  exports: [DateUtilService],
  providers: [DateUtilService],
})
export class DateUtilModule {}
