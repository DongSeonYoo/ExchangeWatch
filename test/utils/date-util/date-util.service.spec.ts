import { Test, TestingModule } from '@nestjs/testing';
import { DateUtilService } from 'src/utils/date-util/date-util.service';

describe('DateUtilService', () => {
  let service: DateUtilService;

  describe('DateUtilService', () => {
    let service: DateUtilService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [DateUtilService],
      }).compile();

      service = module.get<DateUtilService>(DateUtilService);
    });

    describe('getBeginningOfDate', () => {
      it('해당하는 날짜가 시작되는 날을 반환한다.', () => {
        // given
        const date = new Date('2023-10-01T12:34:56Z');
        const expected = new Date('2023-10-01T00:00:00Z');

        // when
        const act = service.getBeginningOfDate(date);

        // then
        expect(act).toBeInstanceOf(Date);
        expect(act).toStrictEqual(expected);
      });
    });

    describe('getBeginningOfDateTommorw', () => {
      it('해당하는 날짜의 다음 날짜를 반환한다.', () => {
        // given
        const date = new Date('2023-10-01T12:34:56Z');
        const expected = new Date('2023-10-02T00:00:00Z');

        // when
        const act = service.getBeginningOfDateTommorw(date);

        // then
        expect(act).toStrictEqual(expected);
        expect(act).toBeInstanceOf(Date);
      });
    });

    describe('addDays', () => {
      it('해당하는 날짜에 특정 기간 (일)을 더한다.', () => {
        // given
        const date = new Date('2023-10-01T12:34:56Z');
        const expected = new Date('2023-10-11T12:34:56Z');
        const addDays = 10;

        // when
        const act = service.addDays(date, addDays);

        // then
        expect(act).toStrictEqual(expected);
        expect(act).toBeInstanceOf(Date);
      });

      it('더할 날짜에 음수가 들어오면 이전 날짜를 반환한다', () => {
        // given
        const date = new Date('2023-10-11T12:34:56Z');
        const addDays = -10;
        const expected = new Date('2023-10-01T12:34:56Z');

        // when
        const act = service.addDays(date, addDays);

        // then
        expect(act).toStrictEqual(expected);
        expect(act).toBeInstanceOf(Date);
      });
    });
  });
});
