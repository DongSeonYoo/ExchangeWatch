export const testConfiguration = () => ({
  database: {
    url: process.env.TEST_DATABASE_URL,
  },
  token: {
    JWT_ACCESS_SECRET: 'test_access_secret',
    JWT_REFRESH_SECRET: 'test_refresh_secret',
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  },
});
