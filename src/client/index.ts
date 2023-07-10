import axios from "axios";
import config from "../config/config";
import { ManageAxiosError } from "../axios/axios-helper";
const qs = require("qs");

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
        client_id: "admin-cli",
      });

      const { data } = await axios.post(
        `${config.KEYCLOAK_HOST}/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        authData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.authToken = `Bearer ${data.access_token}`;
      this.client = await this.getClientIdByClientName();
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUsers() {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByUsername(username: string) {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users?username=${username}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByEmail(email: string) {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users?email=${email}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getGroupsByUserId(userId: string) {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/users/${userId}/groups`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

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
        groups: groups[index],
      }));
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getClientIdByClientName(clientName = config.KEYCLOAK_CLIENT) {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/clients`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

      const result = data.find((client: any) => client.clientId === clientName);
      return result;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async isSessionActive(clientId: string, login: string, sessionId: string) {
    try {
      const { data } = await axios.get(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/clients/${clientId}/user-sessions`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

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
      console.log(this.authToken);
      const { data } = await axios.delete(
        `${config.KEYCLOAK_HOST}/admin/realms/${config.KEYCLOAK_REALM}/sessions/${sessionId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: this.authToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }
}
