import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Elasticsearch Transport
const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    requestTimeout: 5000,
    pingTimeout: 3000,
  },
  index: 'exchange-watch-logs',
  indexTemplate: {
    name: 'exchange-watch-logs-template',
    patterns: ['exchange-watch-logs-*'],
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      'index.lifecycle.name': 'exchange-watch-policy',
      'index.lifecycle.rollover_alias': 'exchange-watch-logs',
    },
  },
  // ES 장애시 에러 처리
  handleExceptions: false,
});

export const winstonConfig: winston.LoggerOptions = {
  level: 'debug',
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('ExchangeWatch', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // ES transport for log/monitoring
    esTransport,

    // 장애대비 파일 백업
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
