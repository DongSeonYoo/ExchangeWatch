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
    const currencies =
      await this.exchangeRateService.getCurrencyExchangeRates(dto);

    return CurrentExchangeRateResDto.of(dto.baseCurrency, currencies);
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
  ): Promise<CurrentExchangeHistoryResDto> {
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
    당신은 외환 시장(Foreign Exchange) 전문 이코노미스트입니다.
    주어진 환율 데이터와 관련 뉴스를 바탕으로 아래 형식에 맞춰 ${dto.baseCurrency}/${dto.currencyCode}에 대한 해당하는 환율 쌍의 데일리 리포트를 생성하세요.

    헤드라인: 현재 상황을 한 문장으로 요약. (예: "${dto.baseCurrency}/${dto.currencyCode}, 좁은 박스권 속 미세한 상승 흐름 포착")
    최근 동향 분석: 최근 ${dto.days}일간의 최고/최저가와 현재 가격을 비교하여 박스권인지, 추세가 있는지 분석.
    관련 뉴스 요약: 해당 기간에 발생한 주요 뉴스 헤드라인들을 리스트업.
    종합 의견: 예를들어: '가격은 현재 상승 추세이며, 같은 기간에 '미국 고용지표 호조'라는 뉴스가 있었습니다' 와 같이, 두 데이터를 나란히 보여주며 상관관계를 암시하는 수준으로만 요약.
  `;
    const responses = await agent.conversate(prompt);
    const jsonResponses = responses.map((r) => r.toJSON());

    const describeResponse = jsonResponses.find(
      (response) => response.type === 'describe',
    );

    const analysisText =
      describeResponse?.text || '분석 결과를 생성할 수 없습니다.';

    return ExchangeRateInsightResDto.from(analysisText);
  }

  /**
   * AI 일일 환율 분석 요약 리포트 가져오기
   */
  @Get('insight/daily')
  async getCurrencyExchangeInsightDaily() {}
}
