import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
} from '../dto/exchange-rates.dto';
import {
  CurrentExchangeHistoryReqDto,
  CurrentExchangeHistoryResDto,
} from '../dto/exchange-rates-history.dto';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { ApiSuccess } from '../../../common/decorators/swaggers/success.decorator';
import { ApiExceptions } from '../../../common/decorators/swaggers/exception.decorator';
import { InvalidCurrencyCodeException } from '../../../common/decorators/validations/is-valid-currency.validator';

@ApiTags('Exchange-rates')
@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * 현재 환율 조회
   *
   * @remarks 현재 최신 환율을 조회합니다. 아마 메인 페이지에서 주요 환율데이터를 초기 로드 할 듯 싶습니다 currencyCode가 비어있다면 주요 30개의 통화를 가져옵니다.
   * 현재 baseCurrency는 EUR만 가능합니다.
   */
  @Get('current')
  @ApiSuccess(CurrentExchangeRateResDto)
  @ApiExceptions({
    exampleTitle: '올바르지 않은 통화 코드일 경우',
    schema: InvalidCurrencyCodeException,
  })
  async getCurrentExchangeRates(
    @Query() dto: CurrentExchangeRateReqDto,
  ): Promise<CurrentExchangeRateResDto> {
    const { baseCurrency, rates } =
      await this.exchangeRateService.getCurrencyExchangeRates(dto);

    return CurrentExchangeRateResDto.of(baseCurrency, rates);
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
    const { baseCurrency, currencyCode } = query;

    const result = await this.exchangeRateService.getHistoricalRates(query);

    return CurrentExchangeHistoryResDto.of(baseCurrency, currencyCode, result);
  }
}
