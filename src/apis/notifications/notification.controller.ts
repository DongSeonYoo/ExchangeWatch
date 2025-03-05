import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiSuccess } from '../../decorators/swaggers/success.decorator';
import { ApiExceptions } from '../../decorators/swaggers/exception.decorator';
import { MaxNotificationCountException } from './exceptions/max-notification-count.exception';
import { AlreadyRegisterNotificationException } from './exceptions/arleady-notification.exception';
import { LoggedInUser } from '../users/decorator/logged-in-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  CreatePriceNotificationReqDto,
  CreatePriceNotificationResDto,
} from './dtos/price-notification/create-price-notification.dto';
import { AccessAuth } from '../../decorators/swaggers/login-auth.decorator';
import {
  SelectPriceNotificationReqDto,
  SelectPriceNotificationResDto,
} from './dtos/price-notification/select-price-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@AccessAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 가격 알림 생성
   *
   * @remarks 사용자가 가격 알림을 생성합니다
   */
  @Post('price')
  @HttpCode(HttpStatus.OK)
  @ApiSuccess(CreatePriceNotificationResDto)
  @ApiExceptions(
    {
      exampleTitle: '유저의 최대 알림 개수가 초과하였을 경우',
      schema: MaxNotificationCountException,
    },
    {
      exampleTitle: '동일한 가격의 알림이 이미 존재할 경우',
      schema: AlreadyRegisterNotificationException,
    },
  )
  async createPriceNotification(
    @Body() dto: CreatePriceNotificationReqDto,
    @LoggedInUser() user: UserEntity,
  ): Promise<CreatePriceNotificationResDto> {
    const notification = await this.notificationService.createPriceNotification(
      dto,
      user.idx,
    );

    return CreatePriceNotificationResDto.of(notification);
  }

  /**
   * 가격 알림 목록 조회
   *
   * @remarks 사용자가 설정한(등록한) 가격 알림 목록을 조회합니다
   */
  @Get('price')
  @ApiSuccess(SelectPriceNotificationResDto)
  async getNotificationList(
    @Query() dto: SelectPriceNotificationReqDto,
    @LoggedInUser() user: UserEntity,
  ) {
    const { items, limit, offset } =
      await this.notificationService.getPriceNotificationList(dto, user.idx);

    return SelectPriceNotificationResDto.of(items, limit, offset);
  }

  /**
   * 최근 발생한 알림 목록 조회
   *
   * @remarks 실제 트리거된 알림 내역을 조회합니다
   */
  @Get('price/histories')
  async getNotificationHistories() {}

  /**
   * 알림 수정
   */
  @Put(':idx')
  @HttpCode(HttpStatus.OK)
  async updateNotification() {}

  /**
   * 알림 삭제
   */
  @Delete(':idx')
  @HttpCode(HttpStatus.OK)
  async deleteNotification() {}
}
