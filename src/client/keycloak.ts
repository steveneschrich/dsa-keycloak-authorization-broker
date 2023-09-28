import axios from "axios";
import config from "../config/config";
import { ManageAxiosError } from "../axios/axios-helper";
import qs from "qs";
import { Logger } from "../logger";

export class KeycloakClient {
  authToken: string;
  client: any;
  instance: any;

  constructor() {
    this.authToken = "";
    this.client = {};
  }

  async init() {
    try {
      const authData = qs.stringify({
        username: config.KEYCLOAK_USER,
        password: config.KEYCLOAK_PASSWORD,
        grant_type: "password",
        client_id: "admin-cli"
      });

      Logger.debug(`KEYCLOAK: Calling authorization endpoint`);

      let axiosConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        data: authData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      };

      const { data } = await axios.request(axiosConfig);
      this.authToken = `Bearer ${data.access_token}`;
      this.client = await this.getClientIdByClientName();
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUsers() {
    try {
      Logger.debug(`KEYCLOAK: Calling realm users endpoint`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByUsername(username: string) {
    try {
      Logger.debug(`KEYCLOAK: Calling realm usernames endpoint`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users?username=${username}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByEmail(email: string) {
    try {
      Logger.debug(
        `KEYCLOAK: Calling realm users endpoint with email: ${email}`
      );

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users?email=${email}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getGroupsByUserId(userId: string) {
    try {
      Logger.debug(
        `KEYCLOAK: Calling realm groups endpoint with userId: ${userId}`
      );

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users/${userId}/groups`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUsersWithGroups() {
    try {
      const users = await this.getUsers();
      const groupsPromises = users.map((user: any) =>
        this.getGroupsByUserId(user.id)
      );
      const groups = await Promise.all(groupsPromises);
      return users.map((user: any, index: number) => ({
        ...user,
        groups: groups[index]
      }));
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getClientIdByClientName(clientName = config.KEYCLOAK_CLIENT) {
    try {
      Logger.debug(`KEYCLOAK: Calling realm clients endpoint`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/clients`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      const result = data.find((client: any) => client.clientId === clientName);
      return result;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async isSessionActive(clientId: string, login: string, sessionId: string) {
    try {
      Logger.debug(
        `KEYCLOAK: Calling realm clients sessions endpoint for clientId: ${clientId}`
      );

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/clients/${clientId}/user-sessions`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      const activeSession = data.find(
        (session: any) => session.id === sessionId
      );

      if (activeSession === undefined) {
        return false;
      }

      if (activeSession.username === login) {
        return true;
      }

      return false;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async deleteSession(sessionId: string) {
    try {
      Logger.debug(`KEYCLOAK: Calling realm delete sessions endpoint`);

      let axiosConfig = {
        method: "delete",
        maxBodyLength: Infinity,
        url: `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/sessions/${sessionId}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }
}
