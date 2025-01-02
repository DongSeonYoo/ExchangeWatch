import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CurrentExchangeRateReqDto,
  CurrentExchangeRateResDto,
} from './dto/current-exchange-rate.dto';
import { ApiSuccess } from '../../decorators/swaggers/success.decorator';
import { ApiExceptions } from '../../decorators/swaggers/exception.decorator';
import { CurrentExchangeHistoryReqDto } from './dto/current-exchange-history.dto';
import { InvalidCurrencyCodeException } from '../../decorators/validations/exceptions/invalid-currency-code';
import { ExchangeRateService } from './exchange-rate.service';

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
    return await this.exchangeRateService.getCurrencyExchangeRates(query);
  }

  /**
   * 특정 환율 히스토리 조회
   *
   * @remarks 특정 환율의 히스토리를 조회합니다.
   */
  @Get('history')
  async getCurrentExchangeHistories(
    @Query() query: CurrentExchangeHistoryReqDto,
  ) {}
}
