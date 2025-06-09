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
import {
  ExchangeRateInsightReqDto,
  ExchangeRateInsightResDto,
} from '../dto/exchange-rates-insight.dto';
import { AgenticaService } from '../../../common/agents/agentica.service';

@ApiTags('Exchange-rates')
@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly agenticaService: AgenticaService,
  ) {}

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

  /**
   * AI 환율 분석 요약 리포트 조회
   *
   * @remarks 특정 통화쌍에 대한 AI 기반 환율 분석 요약 리포트를 제공합니다.
   * 'days' 파라미터로 분석 기간을 지정할 수 있으며, 지정하지 않으면 기본 7일로 분석합니다.
   */
  @Get('insight')
  @ApiSuccess(ExchangeRateInsightResDto)
  @ApiExceptions({
    exampleTitle: '올바르지 않은 통화 코드일 경우',
    schema: InvalidCurrencyCodeException,
  })
  async getCurrencyExchangeInsight(@Query() dto: ExchangeRateInsightReqDto) {
    const agent = await this.agenticaService.getAgent();
    const prompt = `
    ${dto.baseCurrency}/${dto.currencyCode} 환율을 최근 ${dto.days}일간 분석해주세요.
    
    다음 정보를 포함하여 종합적인 분석 리포트를 작성해주세요:
    1. 현재 환율의 상대적 위치 (백분위, 평균 대비)
    2. 최근 추세와 변동성 분석
    3. 주요 고점/저점 대비 현재 상황
    4. 주목할 만한 패턴이나 특징
    
    분석을 위해 필요한 데이터는 available functions를 사용해서 가져와 주세요.
      `;
    await agent
      .conversate(prompt)
      .then((res) => {
        // @TODO 이부분 캐싱 로직 분리해서 SSE로 스트리밍 or 평문으로 응답
        return res.map((r) => r.toJSON());
      })
      .then((res) => console.log('최종 agent 결과: ', res))
      .catch(console.error);
  }
}
