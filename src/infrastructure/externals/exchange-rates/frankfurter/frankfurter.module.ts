import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FrankFurterService } from './frankfurter.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [FrankFurterService],
  providers: [FrankFurterService],
})
export class FrankFurterModule {}
