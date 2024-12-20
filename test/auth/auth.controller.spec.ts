import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/apis/auth/auth.controller';
import { AuthService } from '../../src/apis/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
