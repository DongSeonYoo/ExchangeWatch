import 'reflect-metadata';
import { IExchangeRateAPIService } from '../../src/externals/exchange-rates/interfaces/exchange-rate-api-service';

// Mocking @nestjs-cls module
jest.mock('@nestjs-cls/transactional', () => ({
  ...jest.requireActual('@nestjs-cls/transactional'),
  Transactional: () => () => {},
}));

export const mockExchangeRateAPI: IExchangeRateAPIService = {
  getLatestRates: jest.fn(),
  getHistoricalRates: jest.fn(),
  getFluctuationData: jest.fn(),
  getTimeSeriesData: jest.fn(),
};
