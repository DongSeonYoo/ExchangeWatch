import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RoleService } from './role/role.service';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { v4 as uuidv4 } from 'uuid';
import { ExternalWebSocketGateWay } from '../externals/external-websocket.gateway';
import { DateUtilService } from '../../common/utils/date-util/date-util.service';

@Injectable()
export class LeaderElectionService implements OnApplicationShutdown {
  private readonly instanceId = uuidv4();
  private readonly lockKey = 'leader-lock:collector';
  private readonly lockTtl = 60; // 락 유효시간: 60초

  private heartbeatInterval: NodeJS.Timeout | null = null;
  private watcherInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly roleService: RoleService,
    private readonly loggerService: CustomLoggerService,
    private readonly websocketGateway: ExternalWebSocketGateWay,
    private readonly dateUtilService: DateUtilService,
  ) {
    this.loggerService.context = `LeaderElection:${this.instanceId.slice(0, 8)}`;
  }

  async onApplicationShutdown(signal?: string) {
    this.clearAllTimers();
    if (this.roleService.isLeader) {
      await this.redisService.releaseLock(this.lockKey);
      this.loggerService.debug('Released leader lock on shutdown.');
    }
  }

  /**
   * 리더 선출
   */
  async elect(): Promise<void> {
    if (!this.dateUtilService.isMarketOpen()) {
      this.loggerService.verbose('today market is closed. not connect ws');
      return;
    }

    this.loggerService.verbose('Attempting to acquire leader lock...');
    const isLockAcquired = await this.redisService.setLock(
      this.lockKey,
      this.instanceId,
      this.lockTtl,
    );

    // 리더 락이 비어있을때
    if (isLockAcquired) {
      this.roleService.setAsLeader();
      this.clearWatcher();
      this.startHeartbeat();
      this.loggerService.verbose(
        '>>> Lock acquired. This instance is now the LEADER',
      );

      // 소켓 커넥션 시작
      this.websocketGateway.startConnection();

      this.loggerService.verbose(
        `>>> New leader is elected[${this.lockKey}], re-connect websocket connection`,
      );

      // 없으면 워커역할 수행
    } else {
      this.roleService.setAsWorker();
      this.clearHeartbeat();
      this.startWatching();
      this.loggerService.verbose(
        '>>> Failed to acquire lock. This instance is a WORKER',
      );
    }
  }

  /**
   * 리더가 살아있다면, lock을 임계시간마다 리뉴얼
   */
  private startHeartbeat(): void {
    const renewalInterval = this.lockTtl * 1000 * 0.75; // 45초마다
    this.heartbeatInterval = setInterval(async () => {
      this.loggerService.debug('Renewing leader lock...');
      const renewed = await this.redisService.renewLock(
        this.lockKey,
        this.lockTtl,
      );
      if (!renewed) {
        this.loggerService.warn(
          'Failed to renew lock. Stepping down as leader.',
        );
        await this.elect();
      }
    }, renewalInterval);
  }

  /**
   * 리더가 살아있는지 주기적으로 확인
   */
  private startWatching(): void {
    const watcherInterval = 15 * 1000; // 15초마다
    this.watcherInterval = setInterval(async () => {
      const leaderId = await this.redisService.getRaw(this.lockKey);
      if (!leaderId) {
        this.loggerService.warn(
          'Leader lock not found. Attempting to become new leader...',
        );
        await this.elect();
      }
    }, watcherInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
  private clearWatcher(): void {
    if (this.watcherInterval) clearInterval(this.watcherInterval);
  }

  private clearAllTimers(): void {
    this.clearHeartbeat();
    this.clearWatcher();
  }
}
