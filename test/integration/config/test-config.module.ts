import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { testConfiguration } from './test.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [testConfiguration],
      isGlobal: true,
    }),
  ],
})
export class TestConfigModule {}
