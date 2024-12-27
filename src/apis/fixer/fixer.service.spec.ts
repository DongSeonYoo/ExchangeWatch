import { Test, TestingModule } from '@nestjs/testing';
import { FixerService } from './fixer.service';

describe('FixerService', () => {
  let service: FixerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixerService],
    }).compile();

    service = module.get<FixerService>(FixerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
