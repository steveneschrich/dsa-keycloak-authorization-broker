import axios from "axios";
import config from "../config/config";
import { ManageAxiosError } from "../axios/axios-helper";
require("axios-debug-log");
import qs from "qs";
import { Logger } from "../logger";

const tunnel = require('tunnel');

export class DSAClient {
  girderToken: string;
  groupsCache: Array<any>;

  constructor() {
    this.girderToken = "";
    this.groupsCache = [];
  }

  async init() {
    const loginResponse = await this.authenticate();
    this.girderToken = loginResponse.authToken.token;
  }

  async authenticate(
    dsaUser = config.DSA_USERNAME,
    dsaPassword = config.DSA_PASSWORD
  ) {
    try {
      const encodedToken = Buffer.from(`${dsaUser}:${dsaPassword}`).toString(
        "base64"
      );

      Logger.debug(
        `DSA: Calling authentication endpoint for user ${dsaUser}, with url ${config.DSA_HOST}`
      );

      const agent = tunnel.httpsOverHttp({
        proxy: {
          host: 'https://dsa.moffitt.org',
          port: 443,
        },
      });

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/user/authentication`,
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${encodedToken}`
        },
        agent: agent
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async createUser(
    _login: string,
    _email: string,
    _firstName: string,
    _lastName: string,
    _password: string
  ) {
    try {
      let userParams = qs.stringify({
        login: _login,
        email: _email,
        firstName: _firstName,
        lastName: _lastName,
        password: _password
      });

      Logger.debug(`DSA: Calling authentication endpoint for login ${_login}`);

      let axiosConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/user/user`,
        data: userParams,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUsers() {
    try {
      Logger.debug(`DSA: Calling get users endpoint`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/user?limit=50&sort=lastName&sortdir=1`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string) {
    try {
      Logger.debug(
        `DSA: Calling get users endpoint for usernameOrEmail: ${usernameOrEmail}`
      );

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/user?text=${usernameOrEmail}&limit=50&sort=lastName&sortdir=1`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getGroupById(groupId: string) {
    try {
      const cacheValue = this.groupsCache.find(group => group.id === groupId);

      if (cacheValue !== undefined) {
        return cacheValue;
      }

      Logger.debug(`DSA: Calling get groups endpoint for groupId: ${groupId}`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/group/${groupId}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      const result = {
        id: data._id,
        name: data.name
      };

      this.groupsCache.push(result);

      return result;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserWithGroupsByUsername(username: string) {
    try {
      const user = await this.getUserByUsernameOrEmail(username);

      if (user.length === 0) {
        return user;
      }

      const groupsPromiseArray = user[0].groups.map((groupId: string) =>
        this.getGroupById(groupId)
      );

      user[0].groups = await Promise.all(groupsPromiseArray);
      return user;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getGroupByName(groupName: string) {
    try {
      Logger.debug(`DSA: Calling get groups list for groupName: ${groupName}`);

      let axiosConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/group?text=${groupName}&exact=false&limit=50&sort=name&sortdir=1`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async addUserToGroup(groupId: string, _userId: string) {
    try {
      Logger.debug(
        `DSA: Calling add user to groups for user: ${_userId} with group: ${groupId}`
      );

      let axiosConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/group/${groupId}/invitation`,
        data: { userId: _userId, force: true, level: 0 },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    try {
      Logger.debug(
        `DSA: Calling delete user to groups for user: ${userId} with group: ${groupId}`
      );

      let axiosConfig = {
        method: "delete",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/group/${groupId}/member?userId=${userId}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async changeUserPassword(_userId: string, securePassword: string) {
    try {
      const newPassword = new URLSearchParams();
      newPassword.append("password", securePassword);

      Logger.debug(
        `DSA: calling change user password endpoint for user: ${_userId}`
      );

      let axiosConfig = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${config.DSA_HOST}/api/v1/user/${_userId}/password`,
        data: newPassword.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Girder-Token": this.girderToken
        }
      };

      const { data } = await axios.request(axiosConfig);

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }
}
