export const SOCIAL_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  KAKAO: 'KAKAO',
} as const;

export type SocialProvider =
  (typeof SOCIAL_PROVIDERS)[keyof typeof SOCIAL_PROVIDERS];
