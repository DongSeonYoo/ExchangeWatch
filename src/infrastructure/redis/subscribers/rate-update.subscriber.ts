import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { IRedisSubscriber } from '../interfaces/redis-subsciber.interface';
import Redis from 'ioredis';
import { RedisService } from '../redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IRedisSchema } from '../interfaces/redis-schema.interface';
import { UpdateRateEvent } from '../../events/exchange-rate/update-rate.event';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';

@Injectable()
export class RateUpdateSubscriber
  implements IRedisSubscriber, OnModuleInit, OnModuleDestroy
{
  private readonly subscriber: Redis;
  private readonly rateUpdateChannelPattern = 'rate-update:*';
  private isSubscribed = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.context = RateUpdateSubscriber.name;
    this.subscriber = this.redisService.duplicate;
  }

  async onModuleInit() {
    await this.subscribe();
  }

  async onModuleDestroy() {
    await this.unsubscribe();
  }

  async subscribe(): Promise<void> {
    if (this.isSubscribed) return;

    try {
      await this.subscriber.psubscribe(this.rateUpdateChannelPattern);
      this.isSubscribed = true;

      this.subscriber.on('pmessage', this.handleMessage.bind(this));

      this.logger.info(`Subscribed '${this.rateUpdateChannelPattern}'`);
    } catch (error) {
      this.logger.error(`Failed subscribed: ${error.message}`, error.stack);
      throw error;
    }
  }

  handleMessage(pattern: string, channel: string, message: string): void {
    // 채널 이름에서 통화쌍 추출 (예: "rate-update:EUR/KRW" -> "EUR", "KRW")
    const currencyPairs = channel.split(':')[1];

    const [baseCurrency, currencyCode] = currencyPairs.split('/');
    if (!baseCurrency || !currencyCode) {
      this.logger.warn(`Invalid channel: ${channel}`);
      return;
    }

    const rateData = JSON.parse(message) as IRedisSchema.IUpdateRate;
    this.eventEmitter.emit(
      UpdateRateEvent.eventName,
      new UpdateRateEvent(baseCurrency, {
        ...rateData,
      }),
    );

    this.logger.debug(
      `Recived rate-update publish: ${baseCurrency}/${currencyCode} = ${rateData.rate}`,
    );
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed) {
      return;
    }

    try {
      await this.subscriber.punsubscribe(this.rateUpdateChannelPattern);
      this.subscriber.removeAllListeners('pmessage');
      this.isSubscribed = false;
      this.logger.info(
        `Release redis subscribe about: ${this.rateUpdateChannelPattern}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed subscribe release: ${error.message}`,
        error.stack,
      );
    }
  }
}
