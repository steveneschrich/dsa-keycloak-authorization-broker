import { FastifyServer } from "../interface/server";
import { Logger } from "../logger";

export const healthCheck = (server: FastifyServer) => {
  server.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    (request: any, reply: any) => {
      Logger.debug("</Health endpoint was called>")
      reply.code(200).send({ message: "running" });
    }
  );
};
