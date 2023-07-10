import Pino from "pino";
import { LoggerInterface } from "../interface/logger";

export class PinoLogger implements LoggerInterface {
  private log: any;

  constructor() {
    this.log = Pino({
      name: process.env.APP_ID || "",
      level: process.env.LOG_LEVEL || "debug",
      enabled: process.env.LOG_ENABLED != "false",
      prettyPrint: process.env.LOG_PRETTY_PRINT == "true",
    });
  }

  public debug(message: any): void {
    this.log.debug(message);
  }

  public info(message: any): void {
    this.log.info(message);
  }

  public critical(message: any): void {
    this.log.critical(message);
  }

  public fatal(message: any): void {
    this.log.error(message);
  }

  public warn(message: any): void {
    this.log.warn(message);
  }

  public trace(message: any): void {
    this.log.trace(message);
  }

  public child(message: any): void {
    this.log.child(message);
  }

  public error(message: any): void {
    this.log.error(message);
  }
}
