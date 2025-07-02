import { Test, TestingModule } from '@nestjs/testing';
import { ExternalWebSocketGateWay } from '../../external-websocket.gateway';
import { IExchangeRateWebSocketService } from '../../exchange-rates/interfaces/exchange-rate-websocket.interface';
import { DateUtilService } from '../../../../common/utils/date-util/date-util.service';
import { CustomLoggerService } from '../../../../common/logger/custom-logger.service';
import { mock, MockProxy } from 'jest-mock-extended';

describe('ExternalWebSocketGateWay', () => {
  let externalGateway: ExternalWebSocketGateWay;
  let websocketService: MockProxy<IExchangeRateWebSocketService>;
  let dateUtilService: MockProxy<DateUtilService>;
  let customLoggerService: MockProxy<CustomLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalWebSocketGateWay,
        {
          provide: 'WEBSOCKET_IMPL',
          useValue: mock<IExchangeRateWebSocketService>(),
        },
        {
          provide: DateUtilService,
          useValue: mock<DateUtilService>(),
        },
        {
          provide: CustomLoggerService,
          useValue: mock<CustomLoggerService>(),
        },
      ],
    }).compile();

    externalGateway = module.get(ExternalWebSocketGateWay);
    websocketService = module.get('WEBSOCKET_IMPL');
    dateUtilService = module.get(DateUtilService);
    customLoggerService = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startConnection', () => {
    it('시장 개장 시간에 WebSocket 연결을 시작해야 함', () => {
      // Arrange: 시장이 열려있음
      dateUtilService.isMarketOpen.mockReturnValue(true);

      // Act: 연결 시작
      externalGateway.startConnection();

      // Assert: WebSocket 연결 및 로그 출력
      expect(dateUtilService.isMarketOpen).toHaveBeenCalledTimes(1);
      expect(websocketService.connect).toHaveBeenCalledTimes(1);
      expect(customLoggerService.debug).toHaveBeenCalledWith(
        '[개장]: 실시간 환율정보 수집',
      );
    });

    it('시장 휴장 시간에 WebSocket 연결하지 않아야 함', () => {
      // Arrange: 시장이 닫혀있음
      dateUtilService.isMarketOpen.mockReturnValue(false);

      // Act: 연결 시작
      externalGateway.startConnection();

      // Assert: WebSocket 연결하지 않고 로그만 출력
      expect(dateUtilService.isMarketOpen).toHaveBeenCalledTimes(1);
      expect(websocketService.connect).not.toHaveBeenCalled();
      expect(customLoggerService.debug).toHaveBeenCalledWith(
        '[휴장]: 실시간 환율정보 수집 연결하지 않음',
      );
    });
  });

  describe('리더 전환 시나리오', () => {
    it('새로운 리더가 된 후 시장 개장 시간에 WebSocket 연결', () => {
      // Arrange: 시장이 열려있음
      dateUtilService.isMarketOpen.mockReturnValue(true);

      // Act: 새 리더가 WebSocket 연결 시작
      externalGateway.startConnection();

      // Assert: 즉시 WebSocket 연결
      expect(websocketService.connect).toHaveBeenCalledTimes(1);
      expect(customLoggerService.debug).toHaveBeenCalledWith(
        '[개장]: 실시간 환율정보 수집',
      );
    });

    it('휴장 시간에 새 리더가 되어도 WebSocket 연결하지 않음', () => {
      // Arrange: 시장이 닫혀있음
      dateUtilService.isMarketOpen.mockReturnValue(false);

      // Act: 휴장 시간에 새 리더가 연결 시도
      externalGateway.startConnection();

      // Assert: WebSocket 연결하지 않음
      expect(websocketService.connect).not.toHaveBeenCalled();
      expect(customLoggerService.debug).toHaveBeenCalledWith(
        '[휴장]: 실시간 환율정보 수집 연결하지 않음',
      );
    });
  });
});
