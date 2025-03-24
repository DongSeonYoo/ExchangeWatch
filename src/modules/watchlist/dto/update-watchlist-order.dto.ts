import { IsNumber, Min } from 'class-validator';

export class UpdateWatchListItemOrderReqDto {
  /**
   * 관심통화 인덱스
   * @example 1
   */
  @IsNumber()
  pairIdx: number;

  /**
   * 변경할 순서
   * @example 2
   */
  @IsNumber()
  @Min(0)
  displayOrder: number;
}
