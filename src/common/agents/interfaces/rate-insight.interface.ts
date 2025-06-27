export interface RateInsightSummaryInput {
  /**
   * 기준 통화 코드
   */
  baseCurrency: string;

  /**
   * 타겟 통화 코드
   */
  currencyCode: string;

  /**
   * 분석할 기간 (일수)
   */
  days: number;
}

export interface RateInsightSummaryOutput {
  /**
   * 기준 통화 코드
   */
  baseCurrency: string;

  /**
   * 타겟 통화 코드
   */
  currencyCode: string;

  /**
   * 현재가
   */
  currentRate: number;

  /**
   * 환율 히스토리 데이터
   */
  historicalData: Array<{
    /**
     * 환율 날짜
     */
    rateDate: Date;

    /**
     * 환율
     */
    rate: number;
  }>;
}
