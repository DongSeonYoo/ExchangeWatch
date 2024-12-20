import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/apis/users/users.service';
import { TransactionManager } from 'src/prisma/prisma-transaction.manager';
import { mock, MockProxy } from 'jest-mock-extended';
import { UsersRepository } from 'src/apis/users/users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockProxy<UsersRepository>;
  let transactionManager: MockProxy<TransactionManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useFactory: () => mock<UsersRepository>(),
        },
        {
          provide: TransactionManager,
          useFactory: () => mock<TransactionManager>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UsersRepository);
    transactionManager = module.get(TransactionManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
