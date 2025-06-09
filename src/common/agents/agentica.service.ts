import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agentica } from '@agentica/core';
import { AppConfig } from '../../infrastructure/config/config.type';
import OpenAI from 'openai';
import typia from 'typia';
import { ExchangeRateFunction } from './functions/exchange-rate.function';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { ExchangeRateService } from '../../modules/exchange-rate/services/exchange-rate.service';
import { DateUtilService } from '../utils/date-util/date-util.service';

@Injectable()
export class AgenticaService implements OnModuleInit {
  private agentica: Agentica<'chatgpt'>;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly loggerService: CustomLoggerService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly dateUtilService: DateUtilService,
  ) {
    this.loggerService.context = AgenticaService.name;
  }

  onModuleInit() {
    this.agentica = new Agentica({
      model: 'chatgpt',
      vendor: {
        model: 'gpt-4o',
        api: new OpenAI({
          apiKey: this.configService.get('openai.OPENAI_API_KEY', {
            infer: true,
          }),
        }),
      },
      config: {
        locale: 'ko-KR',
        systemPrompt: {
          common: (config) => {
            return `
          # 환율 분석 전문가
          
          당신은 전문 환율 분석가입니다. 사용자의 환율 분석 요청에 대해 정확하고 이해하기 쉬운 분석을 제공합니다.
          
          ## 기본 원칙
          - 제공된 함수들을 활용하여 정확한 데이터를 기반으로 분석
          - 일반 투자자도 이해할 수 있는 쉬운 언어 사용
          - 투자 조언보다는 현황 분석에 집중
          - 구체적인 수치와 함께 그 의미를 명확히 설명
          
          ## 사용 가능한 도구
          - 환율 OHLC 데이터 분석
          - 관련 뉴스 및 경제 지표 조회 (향후 추가 예정)
          
          항상 사용자 요청에 맞는 적절한 함수를 호출하여 정확한 데이터를 제공하세요.
            `;
          },
        },
      },
      controllers: [
        {
          protocol: 'class',
          name: ExchangeRateFunction.name,
          application: typia.llm.application<ExchangeRateFunction, 'chatgpt'>(),
          execute: new ExchangeRateFunction(
            this.exchangeRateService,
            this.loggerService,
            this.dateUtilService,
          ),
        },
      ],
    });
  }

  async getAgent(): Promise<Agentica<'chatgpt'>> {
    return this.agentica;
  }
}
