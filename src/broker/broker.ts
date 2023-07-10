import { DSAClient } from "../client/dsa";
import { KeycloakClient } from "../client";
import chalk from "chalk";
import generator from "generate-password";
import { Logger } from "../logger";

export class Broker {
  keycloakClient: KeycloakClient;
  dsaClient: DSAClient;

  constructor() {
    this.keycloakClient = new KeycloakClient();
    this.dsaClient = new DSAClient();
  }

  async authorizationNegotiation() {
    // Init the clients
    await this.keycloakClient.init();
    await this.dsaClient.init();

    Logger.debug(chalk.blue("🔎 Running broker for Keycloak and DSA users..."));
    // Call Keycloak client to get users
    let keycloakUsers = await this.keycloakClient.getUsersWithGroups();

    keycloakUsers.forEach(async (keycloakUser: any) => {
      const dsaUser = await this.dsaClient.getUserWithGroupsByUsername(
        keycloakUser.username
      );

      Logger.debug(
        chalk.blue.italic(
          `===> ⚙ Running broker for user <${keycloakUser.username}>`
        )
      );

      if (dsaUser.length > 0) {
        await this.groupsNegotiation(keycloakUser, dsaUser[0]);
      } else {
        Logger.error(
          chalk.red(
            `===> ❌ User with username <${keycloakUser.username}> was not found on DSA`
          )
        );
      }
    });
  }

  private async groupsNegotiation(keycloakUser: any, dsaUser: any) {
    const groupsInKeycloakNotInDSA = keycloakUser.groups.filter(
      (keycloakGroup: any) =>
        !dsaUser.groups.some(
          (dsaGroup: any) => dsaGroup.name === keycloakGroup.name
        )
    );

    const groupsInDSANotInKeycloak = dsaUser.groups.filter((dsaGroup: any) => {
      return !keycloakUser.groups.some(
        (keycloakGroup: any) => keycloakGroup.name === dsaGroup.name
      );
    });

    /***
     * ADD USER
     */
    Logger.debug(
      chalk.green.italic(
        `======> Groups in Keycloak not in DSA [${groupsInKeycloakNotInDSA.map(
          (group: any) => group.name
        )}]`
      )
    );

    for (const keycloakGroup of groupsInKeycloakNotInDSA) {
      const dsaGroup = await this.dsaClient.getGroupByName(keycloakGroup.name);
      Logger.debug(
        chalk.blue.italic(
          `     |===> Adding user <${dsaUser.login}> to group <${keycloakGroup.name}>`
        )
      );
      if (dsaGroup.length > 0) {
        await this.dsaClient.addUserToGroup(dsaGroup[0]._id, dsaUser._id);
      } else {
        console.error(
          chalk.italic.red(
            `     |===> ❌ Group <${keycloakGroup.name}> NOT FOUND on DSA`
          )
        );
      }
    }

    /***
     * REMOVE USER
     */
    Logger.debug(
      chalk.green.italic(
        `======> Groups in DSA not in Keycloak [${groupsInDSANotInKeycloak.map(
          (group: any) => group.name
        )}]`
      )
    );

    for (const dsaGroup of groupsInDSANotInKeycloak) {
      Logger.debug(
        chalk.blue.italic(
          `     |===> Removing user <${dsaUser.login}> from group <${dsaGroup.name}>`
        )
      );
      await this.dsaClient.removeUserFromGroup(dsaGroup.id, dsaUser._id);
    }
  }

  async isSessionActive(keycloakUsername: string, keycloakSessionId: string) {
    await this.keycloakClient.init();
    const isSessionActive = await this.keycloakClient.isSessionActive(
      this.keycloakClient.client.id,
      keycloakUsername,
      keycloakSessionId
    );

    if (!isSessionActive) {
      Logger.debug("Session is not active, returning unauthorized status");
      return {
        status: 401,
        message: "Unauthorized: Session is not active",
      };
    }

    Logger.debug("Session is active, returning authorization status");

    return {
      status: 200,
      message: "Session is active",
    };
  }

  async DSAAuthorization(
    login: string,
    email: string,
    firstName: string,
    lastName: string,
    keycloakUsername: string,
    keycloakSessionId: string
  ) {
    await this.dsaClient.init();
    await this.keycloakClient.init();

    const securePassword = generator.generate({
      length: 10,
      numbers: true,
    });

    /**
     * 1. Search if user session is active in keycloak
     */
    const isSessionActive = await this.keycloakClient.isSessionActive(
      this.keycloakClient.client.id,
      keycloakUsername,
      keycloakSessionId
    );

    if (!isSessionActive) {
      return {
        status: 401,
        message: "Unauthorized: Session is not active",
      };
    }

    /**
     * 2. Check if user exists in DSA
     */
    let dsaUser = await this.dsaClient.getUserWithGroupsByUsername(login);

    if (dsaUser.length < 1) {
      /**
       * 2.1. If user is not present in DSA, create the user
       */
      dsaUser = await this.dsaClient.createUser(
        login,
        email,
        firstName,
        lastName,
        securePassword
      );

      dsaUser.groups = [];
    } else {
      /**
       * 2.2. If user exists change local DSA password
       */

      dsaUser = dsaUser[0];
      await this.dsaClient.changeUserPassword(dsaUser._id, securePassword);
    }

    /**
     * 3. Run authorization broker
     */
    const keycloakUser = await this.keycloakClient.getUserByEmail(email);
    keycloakUser.groups = await this.keycloakClient.getGroupsByUserId(
      keycloakUser[0].id
    );

    await this.groupsNegotiation(keycloakUser, dsaUser);

    /**
     * 4. Login user and retrieve DSA token
     */
    const userAuthorizationObject = await this.dsaClient.authenticate(
      login,
      securePassword
    );

    userAuthorizationObject.status = 200;

    return userAuthorizationObject;
  }

  async deleteKeycloakSession(keycloakSessionId: string) {
    await this.keycloakClient.init();
    return await this.keycloakClient.deleteSession(keycloakSessionId);
  }
}
