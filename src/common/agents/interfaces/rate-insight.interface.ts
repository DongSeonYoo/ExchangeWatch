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
     * 시장 거래일 (OHLC데이터 기준일)
     */
    ohlcDate: Date;

    /**
     * 시가
     */
    open: number;

    /**
     * 고가
     */
    high: number;

    /**
     * 저가
     */
    low: number;

    /**
     * 종가
     */
    close: number;

    /**
     * 평균가
     */
    avg: number;
  }>;
}
