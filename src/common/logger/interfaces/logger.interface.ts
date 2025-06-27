export namespace ILogger {
  export interface ICreateLog {
    level: 'INFO' | 'ERROR' | 'WARN' | 'LOG';
    message: string;
    context?: string;
    trace?: string;
  }
}
