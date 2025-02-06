import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { testConfiguration } from '../config/test.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [testConfiguration],
      isGlobal: true,
    }),
  ],
})
export class TestConfigModule {}
