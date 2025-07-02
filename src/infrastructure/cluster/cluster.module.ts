import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RoleModule } from './role/role.module';
import { LeaderElectionService } from './leader-election.service';
import { RoleService } from './role/role.service';
import { ExchangeRateModule } from '../../modules/exchange-rate/exchange-rate.module';
import { ExternalAPIModule } from '../externals/external.module';
import { ExchangeRateService } from '../../modules/exchange-rate/services/exchange-rate.service';
import { ExternalWebSocketGateWay } from '../externals/external-websocket.gateway';

@Module({
  imports: [RedisModule, RoleModule, ExchangeRateModule, ExternalAPIModule],
  providers: [LeaderElectionService],
})
export class ClusterModule implements OnApplicationBootstrap {
  constructor(
    private readonly electionService: LeaderElectionService,
    private readonly roleService: RoleService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly websocketGateway: ExternalWebSocketGateWay,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // 리더가 선출될때까지 대기
    await this.electionService.elect();

    // 리더가 선출되면 작업 시작.
    if (this.roleService.isLeader) {
      // 외부 API로부터 캐시 웜업
      await this.exchangeRateService.initializeAllCurrencyData();
    }
  }
}
