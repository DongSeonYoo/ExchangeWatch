interface ICursorMetadata {
  nextCursor?: string;
  hasNextPage: boolean;
}

interface IOffsetMetadata {
  totalItems: number;
  totalPages: number;
}

export namespace IPagination {
  export interface IOffsetResponse<T> {
    items: T;
    meta: IOffsetMetadata;
  }

  export interface ICursorResponse<T> {
    items: T;
    meta: ICursorMetadata;
  }
}
