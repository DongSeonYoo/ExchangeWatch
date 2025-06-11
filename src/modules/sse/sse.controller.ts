import { Controller, Get, Query, Req, Sse } from '@nestjs/common';
import { LatestRateSseService } from './services/latest-rate-sse.service';
import { ApiTags } from '@nestjs/swagger';
import { finalize, Observable } from 'rxjs';
import { LatestRateSSERequestDto } from './dto/latest-rate-sse.dto';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: LatestRateSseService) {}

  /**
   * 실시간 환율 정보 구독 요청 (SSE)
   *
   * @remarks baseCurrency를 받아 해당 통화 채널에 구독 요청을 합니다. SSE 연결을 반환합니다.
   */
  @Sse('latest-rate')
  latestRateSse(
    @Query() { baseCurrency }: LatestRateSSERequestDto,
  ): Observable<MessageEvent> {
    return this.sseService.getLastRateObservable(baseCurrency).pipe(
      finalize(() => {
        this.sseService.cleanUpChannel(baseCurrency);
      }),
    );
  }
}
