import { Test } from '@nestjs/testing';
import { UsersRepository } from '../../repositories/users.repository';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';

describe('UserRepository (Integration)', () => {
  let userRepository: UsersRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [UsersRepository],
    }).compile();

    userRepository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
  });
});
