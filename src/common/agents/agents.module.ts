import { Global, Module } from '@nestjs/common';
import { AgenticaService } from './agentica.service';
import { ExchangeRateModule } from '../../modules/exchange-rate/exchange-rate.module';

@Global()
@Module({
  imports: [ExchangeRateModule],
  providers: [AgenticaService],
  exports: [AgenticaService],
})
export class AgentModule {}
