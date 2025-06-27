import { ConfigType } from '@nestjs/config';
import { appConfig } from './env/env.config';

export type AppConfig = ConfigType<typeof appConfig>;
