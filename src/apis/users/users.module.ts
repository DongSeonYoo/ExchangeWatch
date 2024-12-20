import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtAccessStrategy } from '../auth/strategy/jwt.strategy';
import { AuthModule } from '../auth/auth.module';
import { UsersRepository } from './users.repository';
import { TransactionManager } from 'src/prisma/prisma-transaction.manager';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtAccessStrategy,
    UsersRepository,
    TransactionManager,
  ],
})
export class UsersModule {}
