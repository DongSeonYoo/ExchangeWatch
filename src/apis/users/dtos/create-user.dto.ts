import { PickType } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserRequestDto extends PickType(UserEntity, [
  'email',
  'name',
  'password',
]) {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  toEntity(): UserEntity {
    return UserEntity.create({
      email: this.email,
      name: this.name,
      password: this.password,
    });
  }
}

export class CreateUserResponseDto extends PickType(UserEntity, ['idx']) {
  /**
   * 생성된 사용자 인덱스
   */
  idx: number;

  static of(user: UserEntity): CreateUserResponseDto {
    const dto = new CreateUserResponseDto();
    dto.idx = user.idx;

    return dto;
  }
}
