export interface IExchangeRateWebSocketService {
  connect(): void;
  disconnect(): void;
  isHealthy(): boolean;
}
