import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from 'src/decorators/swaggers/success.decorator';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
} from './dtos/create-user.dto';
import { LoginAuth } from 'src/decorators/jwt-auth.decorator';
import { UserEmailExistsException } from './exceptions/user-email-exists.exception';
import { ApiExceptions } from 'src/decorators/swaggers/exception.decorator';
import { UpdateUserRequestDto } from './dtos/update-user.dto';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 회원 가입
   */
  @Post()
  @LoginAuth()
  @HttpCode(HttpStatus.OK)
  @ApiSuccess(CreateUserResponseDto)
  @ApiExceptions({
    exampleTitle: '중복된 이메일이 존재할 경우',
    schema: UserEmailExistsException,
  })
  async createUser(
    @Body() createUserDto: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    const createdUser = await this.usersService.createUser(createUserDto);

    return CreateUserResponseDto.of(createdUser);
  }

  /**
   * 유저 정보 수정
   */
  @Put(':userIdx')
  @LoginAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiExceptions(
    {
      exampleTitle: '해당 유저가 존재하지 않을 경우',
      schema: UserNotFoundException,
    },
    {
      exampleTitle: '중복된 이메일이 존재할 경우',
      schema: UserEmailExistsException,
    },
  )
  async updateUser(
    @Body() updateUserDto: UpdateUserRequestDto,
    @Param('userIdx') userIdx: number,
  ): Promise<void> {
    await this.usersService.updateUser(userIdx, updateUserDto);

    return;
  }
}
