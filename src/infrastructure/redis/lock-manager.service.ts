import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

type LockNames = 'AIreport' | 'daily-aggregation';

@Injectable()
export class LockManagerService {
  private readonly lockId: string = uuidv4();

  constructor(
    private readonly redisService: RedisService,
    private readonly loggerService: CustomLoggerService,
  ) {
    this.loggerService.context = LockManagerService.name;
  }

  /**
   * some act with lock for short-term lock
   */
  async runWithLock<T>(
    lockName: LockNames,
    task: () => Promise<T>,
    ttl: number = 60, // 1min
  ): Promise<T | null> {
    const acquired = await this.redisService.setLock(
      lockName,
      this.lockId,
      ttl,
    );
    if (!acquired) {
      this.loggerService.info(`Could not acquired lock for [${lockName}]`);
      return null;
    }

    try {
      this.loggerService.info(
        `Try to acquire the lock for [${lockName}] job start executing!`,
      );
      const result = await task();
      return result;
    } catch (error) {
      this.loggerService.error(
        `error occurred during acuire [${lockName}]...`,
        error,
      );
      return null;
    } finally {
      await this.redisService.releaseLock(lockName);
      this.loggerService.info(`Released lock for [${lockName}]`);
    }
  }
}
