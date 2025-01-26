import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { PriceNotificationService } from './price-notification.service';

@Controller('price-notification')
export class PriceNotificationController {
  constructor(
    private readonly priceNotificationService: PriceNotificationService,
  ) {}

  /**
   * 알림 생성
   */
  @Post()
  async createPriceNotification() {}

  /**
   * 알림 목록 조회
   */
  @Get()
  async getNotificationList() {}

  /**
   * 알림 수정
   */
  @Put(':idx')
  async updateNotification() {}

  /**
   * 알림 삭제
   */
  @Delete(':idx')
  async deleteNotification() {}
}
