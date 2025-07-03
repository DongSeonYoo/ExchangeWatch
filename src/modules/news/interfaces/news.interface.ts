import { NewsEntity } from '../entitites/news.entity';

export namespace INews {
  export interface ICreate
    extends Pick<
      NewsEntity,
      | 'title'
      | 'content'
      | 'summary'
      | 'currencyCode'
      | 'sourceUrl'
      | 'publishedAt'
    > {}
}
