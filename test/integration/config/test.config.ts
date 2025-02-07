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
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
  },
});

export type TestConfig = ConfigType<typeof testConfiguration>;
