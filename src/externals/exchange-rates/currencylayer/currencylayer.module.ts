import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../configs/config.type';
import { CurrencyLayerService } from './currencylayer.service';

@Module({})
export class CurrencyLayerModule {
  static forRootAsync(): DynamicModule {
    return {
      module: CurrencyLayerModule,
      imports: [
        HttpModule.registerAsync({
          useFactory: async (
            configService: ConfigService<AppConfig, true>,
          ) => ({
            timeout: 5000,
            maxRedirects: 5,
            headers: {
              'API-Key': configService.get('currencyLayer.apiKey', {
                infer: true,
              }),
            },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [CurrencyLayerService],
      exports: [HttpModule],
    };
  }
}
