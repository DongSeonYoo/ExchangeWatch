import { NotificationEntity } from '../../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  BaseOffsetDto,
  BaseOffsetResDto,
} from '../../../../common/dto/pagination/base-offset.dto';

export class SelectPriceNotificationReqDto extends BaseOffsetDto {
  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

export class SelectPriceNotificationResDto extends BaseOffsetResDto {
  @ApiProperty({
    type: () => NotificationEntity,
  })
  items: NotificationEntity[];

  constructor(args: SelectPriceNotificationResDto) {
    super();
    Object.assign(this, args);
  }

  static of(items: NotificationEntity[], limit: number, offset: number) {
    return new SelectPriceNotificationResDto({
      items: items,
      meta: {
        totalCount: items.length,
        limit: limit,
        offset: offset,
      },
    });
  }
}
