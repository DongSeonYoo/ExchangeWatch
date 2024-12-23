import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from '../../src/apis/news/news.controller';
import { NewsService } from '../../src/apis/news/news.service';

describe('NewsController', () => {
  let controller: NewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [NewsService],
    }).compile();

    controller = module.get<NewsController>(NewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
