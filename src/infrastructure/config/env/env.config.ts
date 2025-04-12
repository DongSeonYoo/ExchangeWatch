import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!, 10),
    password: process.env.REDIS_PASSWORD,
  },

  fixer: {
    apiKey: process.env.FIXER_API_KEY,
    apiUrl: process.env.FIXER_API_URL,
  },

  frankFurter: {
    baseUrl: process.env.FRANK_FURTER_URL,
  },

  currencyLayer: {
    apiKey: process.env.CURRENCY_LAYER_API_KEY,
    baseUrl: process.env.CURRENCY_LAYER_BASE_URL,
  },

  coinApi: {
    apiKey: process.env.COIN_API_API_KEY,
    baseUrl: process.env.COIN_API_BASE_URL,
    websocketUrl: process.env.COIN_API_WEBSOCKET_URL,
  },

  aws: {
    bucketName: process.env.AWS_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECERET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },

  cache: {
    latestCurrencyTTL: parseInt(process.env.LATEST_CURRENCY_CACHE_TTL || ''),
    historicalTTL: parseInt(process.env.HISTORICAL_CACHE_TTL || ''),
    fluctuationTTL: parseInt(process.env.FLUCTUATION_CACHE_TTL || ''),
  },

  google: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
  },

  token: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,

    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL,
  },

  fcm: {
    FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
    FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL,
    FCM_PRIVATE_KEY: Buffer.from(process.env.FCM_PRIVATE_KEY!).toString(),
  },
}));
