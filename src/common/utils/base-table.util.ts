export class BaseTableOption {
  /**
   * 생성 일
   */
  createdAt: Date;

  /**
   * 수정 일
   * @default 생성 일
   */
  updatedAt: Date;

  deletedAt: Date | null;
}
