import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from './common/decorators/swaggers/success.decorator';

@ApiTags('HealthCheck')
@Controller()
export class AppController {
  /**
   * 어플리케이션 모니터링을 위한 헬스체크
   *
   * @remarks Health check endpoint for application monitoring
   */
  @Get('/health')
  @ApiSuccess({
    status: 'ok',
    uptime: 12.5838775,
  })
  healthCheck() {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }
}
