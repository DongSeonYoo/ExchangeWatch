import Prisma from '@prisma/client';

export class NewsEntity {
  /**
   * 뉴스 인덱스
   * @example 1
   */
  idx: number;

  /**
   * 뉴스 제목
   * @example "달러-원 환율, 1300원 돌파"
   */
  title: string;

  /**
   * 뉴스 내용
   * @example "오늘 달러-원 환율이 1300원을 돌파했다..."
   */
  content: string;

  /**
   * 뉴스 요약
   * @example "달러-원 환율 1300원 돌파, 연중 최고치 기록"
   */
  summary: string;

  /**
   * 관련 통화 코드
   * @example "USD"
   */
  currencyCode: string;

  /**
   * 뉴스 원본 URL
   * @example "https://example.com/news/1"
   */
  sourceUrl: string;

  /**
   * 뉴스 발행일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  publishedAt: Date;

  /**
   * 생성일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  createdAt: Date;

  /**
   * 수정일시
   * @example "2024-01-01T00:00:00.000Z"
   */
  updatedAt: Date;

  constructor(args: NewsEntity) {
    Object.assign(this, args);
  }

  static from(args: Prisma.News): NewsEntity {
    return new NewsEntity({
      ...args,
    });
  }
}
