import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/apis/users/users.controller';
import { UsersModule } from 'src/apis/users/users.module';
import { UsersService } from 'src/apis/users/users.service';
import { PrismaModule } from 'src/prisma/prisma.module';

describe('UsersController', () => {
  let userController: UsersController;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule, PrismaModule],
    }).compile();

    userController = module.get<UsersController>(UsersController);
    userService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });
});
