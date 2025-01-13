import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
} from './dto/exchange-rates.dto';
import { ApiSuccess } from '../../decorators/swaggers/success.decorator';
import { ApiExceptions } from '../../decorators/swaggers/exception.decorator';
import {
  CurrentExchangeHistoryReqDto,
  CurrentExchangeHistoryResDto,
} from './dto/exchange-rates-history.dto';
import { ExchangeRateService } from './exchange-rate.service';
import { InvalidCurrencyCodeException } from '../../decorators/validations/is-valid-currency.validator';

@ApiTags('Exchange-rates')
@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * 현재 환율 조회
   *
   * @remarks 현재 최신 환율을 조회합니다.
   */
  @Get('current')
  @ApiSuccess(CurrentExchangeRateResDto)
  @ApiExceptions({
    exampleTitle: '올바르지 않은 통화 코드일 경우',
    schema: InvalidCurrencyCodeException,
  })
  async getCurrentExchangeRates(
    @Query() query: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const { latestRates, fluctuationRates } =
      await this.exchangeRateService.getCurrencyExchangeRates(
        query.baseCurrency,
        query.currencyCodes,
      );

    return CurrentExchangeRateResDto.of(
      latestRates,
      fluctuationRates,
      query.currencyCodes,
    );
  }

  /**
   * 특정 환율 히스토리 조회
   *
   * @remarks 특정 환율의 히스토리를 조회합니다
   * 해당하는 기간동안의 OHLC 데이터를 반환합니다.
   * 금일 이전만 조회 가능합니다
   */
  @Get('history')
  @ApiSuccess(CurrentExchangeHistoryResDto)
  async getCurrentExchangeHistories(
    @Query() query: CurrentExchangeHistoryReqDto,
  ) {
    return;
  }
}
