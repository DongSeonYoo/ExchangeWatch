import { DynamicModule, Module } from '@nestjs/common';
import { CoinApiService } from './coin-api.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.type';

@Module({})
export class CoinApiModule {
  static forRootAsync(): DynamicModule {
    return {
      module: CoinApiModule,
      imports: [
        HttpModule.registerAsync({
          useFactory: async (
            configService: ConfigService<AppConfig, true>,
          ) => ({
            timeout: 5000,
            maxRedirects: 5,
            headers: {
              Authorization: `${configService.get('coinApi.apiKey', { infer: true })}`,
            },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [CoinApiService],
      exports: [HttpModule],
    };
  }
}
