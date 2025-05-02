import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '../../common/decorators/swaggers/success.decorator';
import { AccessAuth } from '../../common/decorators/swaggers/login-auth.decorator';
import { UserProfileResDto } from './dto/user-profile.dto';
import { LoggedInUser } from './decorator/logged-in-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UserDeviceRegisterReqDto } from './dto/user-device.dto';

@ApiTags('Users')
@Controller('users')
@AccessAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자 프로필 조회
   *
   * @remarks 사용자의 프로필 정보를 조회합니다
   */
  @Get('profile')
  @ApiSuccess(UserProfileResDto)
  async getUserProfile(@LoggedInUser() user: UserEntity) {
    const userProfile = await this.usersService.findUserByIdx(user.idx);

    return UserProfileResDto.from(userProfile);
  }

  /**
   * 유저 디바이스 토큰 생성
   *
   * @remarks FCM device token을 서버에 등록해서 푸시 알림을 수신합니다.
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('user-device')
  async registerUserDevice(
    @LoggedInUser() user: UserEntity,
    @Body() dto: UserDeviceRegisterReqDto,
  ): Promise<void> {
    await this.usersService.registerUserDevice({
      deviceToken: dto.deviceToken,
      deviceType: dto.deviceType,
      userIdx: user.idx,
    });

    return;
  }
}
