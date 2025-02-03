import { Logger, Module } from '@nestjs/common';
import { FrankFurterService } from './frankfurter.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  exports: [FrankFurterService],
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [FrankFurterService, Logger],
})
export class FrankFurterModule {}
