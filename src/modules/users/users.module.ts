import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersDeviceRepository } from './repositories/users-device.repository';

@Module({
  exports: [UsersService],
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersDeviceRepository],
})
export class UsersModule {}
