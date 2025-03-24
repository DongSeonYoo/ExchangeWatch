import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MockFixerService } from './fixer-mock.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [MockFixerService],
})
export class FixerModule {}
