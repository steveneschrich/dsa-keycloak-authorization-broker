import { Route } from "./interface/route";
import { FastifyServer } from "./interface/server";

import { healthCheck } from "./routes/health-check.route";
import { DSARoutes } from "./routes/authorization.route";
import { Logger } from "./logger";
import config from "./config/config";

export class Application {
  PORT: number;
  HOST: string;
  constructor(private readonly server: FastifyServer) {
    this.PORT = config.APP_PORT;
    this.HOST = config.APP_HOST;
  }

  private async registerRoutes() {
    const routes: Array<Route> = [healthCheck, DSARoutes];
    routes.forEach((route) => route(this.server));
  }

  public async init() {
    await this.registerRoutes();
    Logger.info("registered routes");
    this.server.register(require("@fastify/cors"), {
      origin: "*",
      methods: ["POST"],
    });
    await this.server.ready();
  }

  public run() {
    const options = {
      port: this.PORT,
      host: this.HOST,
    };
    this.server.listen(options, async (err: Error | null, address: string) => {
      if (err) {
        Logger.error(err);
        process.exit(1);
      }
    });
  }
}
