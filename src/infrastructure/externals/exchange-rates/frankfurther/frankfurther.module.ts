import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FrankFurtherService } from './FrankFurther.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [FrankFurtherService],
  providers: [FrankFurtherService],
})
export class FrankFurtherModule {}
