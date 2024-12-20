import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersRepository } from '../../src/apis/users/users.repository';
import { PrismaService } from 'src/prisma/prisma.service';

describe('UsersRepository', () => {
  let userRepository: UsersRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UsersRepository],
    }).compile();

    userRepository = module.get<UsersRepository>(UsersRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  // docker로 테스트db 구축해서 integration test
  it.todo('should create a new users');
});
