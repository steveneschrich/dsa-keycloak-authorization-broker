import { FastifyServer } from "../interface/server";
import { Broker } from "../broker/broker";
import { Logger } from "../logger";

export const DSARoutes = (server: FastifyServer) => {
  const broker = new Broker();

  server.post("/authorization", async (request: any, reply: any) => {
    const {
      login,
      keycloakSessionId,
      email,
      firstName,
      lastName,
      keycloakUsername,
    } = request.body;

    const brokerResponse = await broker.DSAAuthorization(
      login,
      email,
      firstName,
      lastName,
      keycloakUsername,
      keycloakSessionId
    );

    Logger.debug(
      `</authorization endpoint was called with response: ${JSON.stringify(
        brokerResponse
      )}>`
    );

    if (brokerResponse.status === 401) {
      reply.code(401).send(brokerResponse.message);
    }

    reply.code(200).send({ dsaAuthObject: brokerResponse });
  });

  server.post("/isSessionActive", async (request: any, reply: any) => {
    const { keycloakSessionId, keycloakUsername } = request.body;

    const isSessionActive = await broker.isSessionActive(
      keycloakUsername,
      keycloakSessionId
    );

    Logger.debug(
      `</isSessionActive endpoint was called with response: ${JSON.stringify(
        isSessionActive
      )}>`
    );

    if (isSessionActive.status === 200) {
      reply.code(200).send(isSessionActive);
      return;
    }

    reply.code(401).send(isSessionActive);
  });

  server.post("/logout", async (request: any, reply: any) => {
    const { keycloakSessionId } = request.body;
    await broker.deleteKeycloakSession(keycloakSessionId);

    Logger.debug(`</logout endpoint was called>`);
    reply.code(200);
  });
};
