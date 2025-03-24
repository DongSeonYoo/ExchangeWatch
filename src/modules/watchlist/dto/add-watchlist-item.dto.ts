import { IsNotEmpty } from 'class-validator';
import { WatchlistEntity } from '../entitites/watch-list.entity';
import { IsValidCurrencyCode } from '../../../common/decorators/validations/is-valid-currency.validator';

export class AddWatchlistItemReqDto {
  /**
   * 대상 통화
   *
   * @example "USD"
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  currencyCode: string;

  /**
   * 기준 통화
   *
   * @example "KRW"
   */
  @IsNotEmpty()
  @IsValidCurrencyCode()
  baseCurrency: string;
}

export class AddWatchlistItemResDto {
  /**
   * 생성된 관심 통화 인덱스
   *
   * @example 1
   */
  idx: number;

  constructor(args: AddWatchlistItemResDto) {
    Object.assign(this, args);
  }

  static from(args: WatchlistEntity) {
    return new AddWatchlistItemResDto({
      idx: args.idx,
    });
  }
}
