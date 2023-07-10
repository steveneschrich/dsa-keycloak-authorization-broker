export interface LoggerInterface {
  info(message: any): void;
  debug(message: any): void;
  error(message: any): void;
  critical(message: any): void;
  warn(message: any): void;
  trace(message: any): void;
  child(message: any): void;
  fatal(message: any): void;
}
