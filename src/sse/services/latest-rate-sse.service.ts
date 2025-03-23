import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class LatestRateSseService {
  private readonly logger = new Logger(LatestRateSseService.name);
  private readonly subjectPrefix = 'rate-update:';
  // 채널별로 Subject를 관리
  private channelSubjects = new Map<string, Subject<any>>();

  /**
   * 특정 채널의 이벤트를 구독할 Observable을 반환
   */
  getLastRateObservable(baseCurrency: string): Observable<any> {
    const subjectName = this.subjectPrefix + baseCurrency;
    if (!this.channelSubjects.has(subjectName)) {
      this.channelSubjects.set(subjectName, new Subject<any>());
      this.logger.debug(`Created new subject for channel: ${subjectName}`);
    }
    return this.channelSubjects.get(subjectName)!.asObservable();
  }

  /**
   * 특정 채널에 이벤트를 전파합니다.
   */
  emitEvent(baseCurrency: string, data: any): void {
    const subjectName = this.subjectPrefix + baseCurrency;
    const subject = this.channelSubjects.get(subjectName);
    if (subject) {
      subject.next(data);
      this.logger.debug(`Emitted event on channel: ${subjectName}`);
    } else {
      this.logger.debug(`No subject exists for channel: ${subjectName}`);
    }
  }

  /**
   * 필요 시 특정 채널을 정리합니다.
   */
  removeChannel(channel: string): void {
    const subject = this.channelSubjects.get(channel);
    if (subject) {
      subject.complete();
      this.channelSubjects.delete(channel);
      this.logger.debug(`Removed channel: ${channel}`);
    }
  }
}
