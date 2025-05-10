import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';

/**
 * TODO
 *  - base SseService만들고, 도메인 별 sseService가 상속받아 비즈니스 이어받게
 *  - 정기적인 shceduler로 비어있는 channel삭제
 */
@Injectable()
export class LatestRateSseService {
  private readonly subjectPrefix = 'latest-rate:';
  /**
   * subjectName: latest-rate:KRW, { ... eventData }
   * Map<subjectName, eventData>
   */
  private subjects = new Map<string, Subject<any>>();

  constructor(private readonly logger: CustomLoggerService) {
    this.logger.context = LatestRateSseService.name;
  }

  /**
   * 특정 채널의 이벤트를 구독할 Observable을 반환
   */
  getLastRateObservable(baseCurrency: string): Observable<any> {
    const subjectName = this.subjectPrefix + baseCurrency;
    if (!this.subjects.has(subjectName)) {
      this.subjects.set(subjectName, new Subject<any>());
      this.logger.debug(`Created new subject for channel: ${subjectName}`);
    }
    return this.subjects.get(subjectName)!.asObservable();
  }

  /**
   * 특정 Subject에 이벤트를 전파
   */
  emitEvent(baseCurrency: string, data: any): void {
    const subjectName = this.subjectPrefix + baseCurrency;
    const subject = this.subjects.get(subjectName);
    if (subject) {
      subject.next(data);
      this.logger.debug(
        `Emitted event on channel: ${subjectName}, payload: ${JSON.stringify(data)}`,
      );
    } else {
      this.logger.verbose(
        `Tried to emit SSE on missing channel: ${subjectName}, payload: ${JSON.stringify(data)}`,
      );
    }
  }

  /**
   * 클라이언트 연결 종료 시 Idle Subject 삭제 or 스케쥴러 돌릴수있음
   */
  removeChannel(channel: string): void {
    const subject = this.subjects.get(channel);
    if (subject) {
      subject.complete();
      this.subjects.delete(channel);
      this.logger.info(`Removed idle channel: ${channel}`);
    }
  }
}
