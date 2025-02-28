import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { NotificationEntity } from '../../entities/notification.entity';
import { IsValidCurrencyCode } from '../../../../decorators/validations/is-valid-currency.validator';

/**
 * 가격 알림 생성 DTO
 */
export class CreatePriceNotificationReqDto {
  /**
   * 기준 통화
   *
   * @example KRW
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;

  /**
   * 대상 통화
   *
   * @example EUR
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;

  /**
   * 설정할 가격
   *
   * @example 1500
   */
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  targetPrice: number;
}

export class CreatePriceNotificationResDto {
  /**
   * 생성된 알림 인덱스
   *
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  private readonly notificationIdx: string;

  private constructor(notificationIdx: string) {
    this.notificationIdx = notificationIdx;
  }

  static of(args: NotificationEntity) {
    return new CreatePriceNotificationResDto(args.idx);
  }
}
