// condition of alert
export const ALERT_CONDITIONS = {
  ABOVE: 'ABOVE',
  BELOW: 'BELOW',
} as const;

// kind of social_providers
export const SOCIAL_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  KAKAO: 'KAKAO',
} as const;

export type AlertCondition =
  (typeof ALERT_CONDITIONS)[keyof typeof ALERT_CONDITIONS];
export type SocialProvider =
  (typeof SOCIAL_PROVIDERS)[keyof typeof SOCIAL_PROVIDERS];
