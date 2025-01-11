import { Module } from '@nestjs/common';
import { MockFixerService } from './mock/fixer-mock.service';
import { FixerService } from './fixer.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [MockFixerService, FixerService],
  providers: [MockFixerService, FixerService],
})
export class FixerModule {}
