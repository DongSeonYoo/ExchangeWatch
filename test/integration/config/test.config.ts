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
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,

    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL,
  },
  google: {
    GOOGLE_CLIENT_ID: 'googe-test-client',
    GOOGLE_CLIENT_SECRET: 'google-test-client-secret',
    GOOGLE_REDIRECT_URL: 'google-test-redirect-url',
  },
});

export type TestConfig = ConfigType<typeof testConfiguration>;
