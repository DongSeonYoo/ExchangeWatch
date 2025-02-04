import { Module } from '@nestjs/common';
import { FrankFurterModule } from './exchange-rates/frankfurter/frankfurter.module';
import { FixerModule } from './exchange-rates/fixer/fixer.module';
import { FrankFurterService } from './exchange-rates/frankfurter/frankfurter.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [FrankFurterModule, FixerModule, HttpModule.register({})],
  exports: ['EXCHANGE_RATE_API'],
  providers: [
    {
      provide: 'EXCHANGE_RATE_API',
      useClass: FrankFurterService,
    },
  ],
})
export class ExternalAPIModule {}
