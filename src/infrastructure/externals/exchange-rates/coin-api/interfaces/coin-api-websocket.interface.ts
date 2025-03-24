export namespace CoinApiWebSocket {
  export interface ExchangeRateMessage {
    time: string;
    asset_id_base: string;
    asset_id_quote: string;
    rate_type: string;
    rate: number;
    type: 'exrate';
  }

  export interface HeartbeatMessage {
    time: string;
    type: 'heartbeat';
  }

  export interface SubscriptionMessage {
    type: 'hello' | 'heartbeat';
    apikey: string;
    heartbeat: boolean;
    subscribe_filter_asset_id: string[];
    subscribe_update_limit_ms_exrate: number;
  }
}
