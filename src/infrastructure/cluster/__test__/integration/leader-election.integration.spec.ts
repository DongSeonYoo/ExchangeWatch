import { Test, TestingModule } from '@nestjs/testing';
import { LeaderElectionService } from '../../leader-election.service';
import { RedisService } from '../../../redis/redis.service';
import { RoleService } from '../../role/role.service';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';
import { TestIntegrateModules } from '../../../../../test/integration/utils/integrate-module.util';
import { mock, MockProxy } from 'jest-mock-extended';
import { ExternalWebSocketGateWay } from '../../../externals/external-websocket.gateway';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';

describe('LeaderElectionService Integration', () => {
  let service: LeaderElectionService;
  let redisService: RedisService;
  let roleService: RoleService;
  let loggerService: CustomLoggerService = mock<CustomLoggerService>();
  let dateUtilService: MockProxy<DateUtilService>;
  let websocketGateway: MockProxy<ExternalWebSocketGateWay>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TestIntegrateModules.create()],
      providers: [
        RedisService,
        LeaderElectionService,
        RoleService,
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
        {
          provide: CustomLoggerService,
          useValue: loggerService,
        },
        CustomLoggerService,
        {
          provide: ExternalWebSocketGateWay,
          useValue: mock<ExternalWebSocketGateWay>(),
        },
      ],
    }).compile();

    service = module.get<LeaderElectionService>(LeaderElectionService);
    redisService = module.get<RedisService>(RedisService);
    roleService = module.get<RoleService>(RoleService);
    loggerService =
      await module.resolve<CustomLoggerService>(CustomLoggerService);
    dateUtilService = module.get(DateUtilService);
    websocketGateway = module.get(ExternalWebSocketGateWay);
  });

  afterEach(async () => {
    await redisService.del('leader-lock:collector');
  });

  describe('Blue-Green 배포 시나리오', () => {
    it('Blue 컨테이너가 Leader이고 Green 컨테이너가 배포될 때', async () => {
      // Arrange: Blue 컨테이너가 이미 리더 락 보유
      await redisService.setLock(
        'leader-lock:collector',
        'blue-container-id',
        60,
      );

      // Act: Green 컨테이너가 리더 선출 시도
      await service.elect();

      // Assert: Green은 어쩔수없이 Worker가 됨
      expect(roleService.isLeader).toBe(false);
    });

    it('Blue 컨테이너 종료 후 재선출 시 Green이 리더 획득하면 바로 소켓연결을 시작한다', async () => {
      // Arrange: 리더 락이 없는 상태 (blue 종료됨)
      dateUtilService.isMarketOpen.mockReturnValue(true);
      await redisService.del('leader-lock:collector');

      // Act: Green이 리더 선출
      await service.elect();

      // Assert
      expect(roleService.isLeader).toBe(true);
      expect(websocketGateway.startConnection).toHaveBeenCalled();
    });
  });
});
