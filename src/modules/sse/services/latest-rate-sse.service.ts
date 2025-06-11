import { Injectable } from '@nestjs/common';
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
  private readonly subjects = new Map<string, Subject<MessageEvent>>();
  private readonly subscriberCounts = new Map<string, number>();

  constructor(private readonly logger: CustomLoggerService) {
    this.logger.context = LatestRateSseService.name;
  }

  /**
   * 특정 채널의 이벤트를 구독할 Observable을 반환
   */
  getLastRateObservable(baseCurrency: string): Observable<any> {
    const subjectName = this.subjectPrefix + baseCurrency;
    if (!this.subjects.has(subjectName)) {
      this.subjects.set(subjectName, new Subject<MessageEvent>());
      this.logger.debug(`Created new subject for channel: ${subjectName}`);
    }
    // 새로운 구독자 생길때마다 카운트 증가
    const currentSubjectCount = this.subscriberCounts.get(subjectName) || 0;
    this.subscriberCounts.set(subjectName, currentSubjectCount + 1);

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
   * 클라이언트가 연결 종료 시, 해당 채널의 카운트 감소 및 idle채널 정리
   *
   * @param baseCurrency 채널 이름에 해당되는 baseCurrency
   */
  cleanUpChannel(baseCurrency: string): void {
    const subjectName = this.subjectPrefix + baseCurrency;

    // 종료 시 해당 채널의 카운트 1 감소
    const currentCount = this.subscriberCounts.get(subjectName) || 0;
    const newCount = Math.max(0, currentCount - 1);

    // 만약 해당 채널의 모든 구독자가 빠져나갔을 경우 채널 완전히 삭제
    if (newCount === 0) {
      const subject = this.subjects.get(subjectName);
      if (subject) {
        subject.complete();
        this.subjects.delete(subjectName);
      }

      this.subscriberCounts.delete(subjectName);
      this.logger.info(
        `Last subscriber left, Destroy [${subjectName}] channel`,
      );

      return;
    }

    // 그렇지 않을 경우엔 해당 채널의 카운트만 업데이트
    this.subscriberCounts.set(subjectName, newCount);
    this.logger.info(`Subscriber left from ${subjectName}`);
  }
}
