import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  FRONTEND_URL: Joi.string().required(),
  API_URL: Joi.string().required(),

  // Database
  DATABASE_URL: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Fixer API
  FIXER_API_KEY: Joi.string().required(),
  FIXER_API_URL: Joi.string().uri().required(),

  // Frnank further API
  FRANK_FURTHER_URL: Joi.string().uri().required(),

  // CurrencyLayer API
  CURRENCY_LAYER_API_KEY: Joi.string().required(),
  CURRENCY_LAYER_BASE_URL: Joi.string().uri().required(),

  // CoinAPI API,
  COIN_API_API_KEY: Joi.string().required(),
  COIN_API_BASE_URL: Joi.string().required(),
  COIN_API_WEBSOCKET_URL: Joi.string().required(),

  // AWS (Optional)
  AWS_BUCKET_NAME: Joi.string().allow('').optional(),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  AWS_SECERET_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_REGION: Joi.string().required(),

  // Cache Policy
  LATEST_CURRENCY_CACHE_TTL: Joi.number().required(),
  HISTORICAL_CACHE_TTL: Joi.number().required(),
  FLUCTUATION_CACHE_TTL: Joi.number().required(),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URL: Joi.string().uri().required(),

  // JWT Tokens
  JWT_ACCESS_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().required(),
  REFRESH_TOKEN_TTL: Joi.number().required(),

  // FCM
  FCM_PROJECT_ID: Joi.string().required(),
  FCM_CLIENT_EMAIL: Joi.string().required(),
  FCM_PRIVATE_KEY: Joi.string().required(),

  // OPENAI
  OPEN_API_KEY: Joi.string().required(),
});
