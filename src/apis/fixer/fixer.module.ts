import { Module } from '@nestjs/common';
import { MockFixerService } from './mock/fixer-mock.service';

@Module({
  exports: [MockFixerService],
  providers: [MockFixerService],
})
export class FixerModule {}
