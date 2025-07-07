/**
 * @todo 임계값 설정 시 고려해야 할 점 (프로덕션 시)
 * 순수 변동률 기반 임계값은 다양한 통화의 절대적인 스케일을 고려하지 않음.
 * - 스케일이 작은 통화(JPY, USD 등)은 미미한 변동에도 쉽게 임계값을 넘음
 * - 스케일이 큰 통화(IDR 등)은 큰 폭으로 움직여도 백분율 변화는 작아서 임계값을 넘기지 못하고 변동성을 놓칠 수 있음
 *
 * 각 통화쌍 별로 백분율 기준을 정해놓고 (rate / 100), 최소 절대 변동폭을 설정
 * 이후 두 소수를 비교해서 더 큰 값을 그 순간에 임계값으로 동적으로 선택
 */

export const CURRENCY_THRESHOLDS: Record<
  string,
  { pct: number; minAbs: number }
> = {
  // G7 & Major Currencies
  USD: { pct: 0.1, minAbs: 0.000007 },
  EUR: { pct: 0.1, minAbs: 0.000006 },
  GBP: { pct: 0.1, minAbs: 0.000005 },
  CAD: { pct: 0.1, minAbs: 0.000009 },
  AUD: { pct: 0.1, minAbs: 0.00001 },
  CHF: { pct: 0.1, minAbs: 0.000006 },
  NZD: { pct: 0.1, minAbs: 0.000012 },
  SGD: { pct: 0.1, minAbs: 0.000009 },
  HKD: { pct: 0.1, minAbs: 0.00005 },

  // Special Scale Currencies
  JPY: { pct: 0.15, minAbs: 0.001 },
  HUF: { pct: 0.15, minAbs: 0.002 },
  ISK: { pct: 0.15, minAbs: 0.001 },

  // High Value Currencies
  IDR: { pct: 0.2, minAbs: 0.1 },
  INR: { pct: 0.2, minAbs: 0.005 },
  PHP: { pct: 0.2, minAbs: 0.04 },
  THB: { pct: 0.2, minAbs: 0.02 },

  // Volatile & Emerging Currencies
  BRL: { pct: 0.5, minAbs: 0.0001 },
  TRY: { pct: 0.8, minAbs: 0.0002 },
  ZAR: { pct: 0.5, minAbs: 0.0001 },
  MXN: { pct: 0.4, minAbs: 0.0001 },

  // All other currencies will use this default
  DEFAULT: { pct: 0.2, minAbs: 0.0001 },
} as const;
