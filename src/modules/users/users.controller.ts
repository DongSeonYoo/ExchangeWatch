import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '../../common/decorators/swaggers/success.decorator';
import { AccessAuth } from '../../common/decorators/swaggers/login-auth.decorator';
import { UserProfileResDto } from './dto/user-profile.dto';
import { LoggedInUser } from './decorator/logged-in-user.decorator';
import { UserEntity } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자 프로필 조회
   *
   * @remarks 사용자의 프로필 정보를 조회합니다
   */
  @Get('profile')
  @ApiSuccess(UserProfileResDto)
  @AccessAuth()
  async getUserProfile(@LoggedInUser() user: UserEntity) {
    const userProfile = await this.usersService.findUserByIdx(user.idx);

    return UserProfileResDto.from(userProfile);
  }
}
