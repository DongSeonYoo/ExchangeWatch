import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserRequestDto } from './create-user.dto';
import { UserEntity } from '../entities/user.entity';

export class UpdateUserRequestDto extends PartialType(
  OmitType(CreateUserRequestDto, ['toEntity']),
) {
  email?: string | undefined;

  name?: string | undefined;

  password?: string | undefined;

  toEntity(): Partial<UserEntity> {
    return UserEntity.update(this);
  }
}
