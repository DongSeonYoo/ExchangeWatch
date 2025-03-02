/**
 * base cursor option.
 *
 * <T>: uuid or auto-increment
 */
export interface IBaseCursorReq<T extends string | number> {
  limit: number;

  cursor?: T;
}

export interface IBaseCursorRes<T extends string | number> {
  meta: {
    hasNextPage: boolean;
    nextCursor?: T;
  };
}
