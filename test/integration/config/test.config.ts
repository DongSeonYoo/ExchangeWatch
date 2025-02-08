import { ConfigType } from '@nestjs/config';

export const testConfiguration = () => ({
  database: {
    url: process.env.TEST_DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.TEST_REDIS_PORT!, 10),
    password: process.env.REDIS_PASSWORD,
  },
  token: {
    JWT_ACCESS_SECRET: 'test_access_secret',
    JWT_REFRESH_SECRET: 'test_refresh_secret',
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  },

  google: {
    GOOGLE_CLIENT_ID: 'googe-test-client',
    GOOGLE_CLIENT_SECRET: 'google-test-client-secret',
    GOOGLE_REDIRECT_URL: 'google-test-redirect-url',
  },
});

export type TestConfig = ConfigType<typeof testConfiguration>;
