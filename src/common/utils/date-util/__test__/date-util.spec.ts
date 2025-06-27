import { Test } from '@nestjs/testing';
import { DateUtilService } from '../date-util.service';
DateUtilService;

describe('DateUtilService', () => {
  let dateUtilService: DateUtilService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [],
      providers: [DateUtilService],
    }).compile();

    dateUtilService = module.get(DateUtilService);
  });

  it('should defined DateUtilService', () => {
    expect(dateUtilService).toBeDefined();
  });

  describe('subDate', () => {
    it('should return subtracted date from specified date', () => {
      // Arrange
      const targetDate = new Date('2025-01-01');

      // Act
      const result = dateUtilService.subDate(2, 'day', targetDate);

      // assert
      expect(result).toStrictEqual(new Date('2024-12-30'));
    });
  });

  describe('getYesterday', () => {
    it('should return yesterday from specified date', () => {
      // Arrange
      const expectedDate = new Date('2025-03-15');

      // Act
      const result = dateUtilService.getYesterday(new Date('2025-03-16'));

      // Assert
      expect(result).toStrictEqual(expectedDate);
    });
  });

  describe('getDatesBetween', () => {
    it('should create date array between both dates', () => {
      // Arrange
      const startedDate = new Date('2020-10-27');
      const endedDate = new Date('2022-04-26');

      // Act
      const result = dateUtilService.getDatesBetween(startedDate, endedDate);

      // Assert
      // 현역병 군복무일수 젠장
      expect(result).toHaveLength(547);
    });
  });

  describe('isBefore', () => {
    it('should success to compare isBefore between target1 and target2', () => {
      // Arrange
      const targetDate1 = new Date('2025-01-01');
      const targetDate2 = new Date('2025-01-02');

      // Act
      const result = dateUtilService.isBefore(targetDate1, targetDate2);

      // Assert
      expect(result).toBeTruthy();
    });

    it('should fail to compare when dates are same', () => {
      // Arrange
      const targetDate1 = new Date('2025-01-01');
      const targetDate2 = new Date('2025-01-01');

      // Act
      const result = dateUtilService.isBefore(targetDate1, targetDate2);

      // Assert
      expect(result).toBeFalsy();
    });
  });

  describe('isNewTradingDay', () => {
    it('should return false when two timestamps are on the same day', () => {
      // Arrange
      const prevTimestamp = new Date('2025-06-10T00:00:00Z').getTime();
      const currentTimestamp = new Date('2025-06-10T23:59:00Z').getTime();

      // Act
      const result = dateUtilService.isNewTradingDay(
        currentTimestamp,
        prevTimestamp,
      );

      // Assert
      expect(result).toBeFalsy();
    });

    it('should return true if the current timestamp is on a different day than the previous one', () => {
      // Arrange
      const prevTimestamp = new Date('2025-06-10T23:59:59Z').getTime();
      const currentTimestamp = new Date('2025-06-11T00:00:00Z').getTime();

      // Act
      const result = dateUtilService.isNewTradingDay(
        currentTimestamp,
        prevTimestamp,
      );

      // Assert
      expect(result).toBeTruthy();
    });
  });
});
