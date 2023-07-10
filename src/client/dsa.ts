import axios from "axios";
import config from "../config/config";
import { ManageAxiosError } from "../axios/axios-helper";
require("axios-debug-log");
import qs from "qs";

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
      const { data } = await axios.get(
        `${config.DSA_HOST}/api/v1/user/authentication`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${encodedToken}`,
          },
        }
      );

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
        password: _password,
      });

      const { data } = await axios.post(
        `${config.DSA_HOST}/api/v1/user`,
        userParams,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUsers() {
    try {
      const { data } = await axios.get(
        `${config.DSA_HOST}/api/v1/user?limit=50&sort=lastName&sortdir=1`,
        {
          headers: {
            Accept: "application/json",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string) {
    try {
      const { data } = await axios.get(
        `${config.DSA_HOST}/api/v1/user?text=${usernameOrEmail}&limit=50&sort=lastName&sortdir=1`,
        {
          headers: {
            Accept: "application/json",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async getGroupById(groupId: string) {
    try {
      const cacheValue = this.groupsCache.find((group) => group.id === groupId);
      console;
      if (cacheValue !== undefined) {
        return cacheValue;
      }

      const { data } = await axios.get(
        `${config.DSA_HOST}/api/v1/group/${groupId}`,
        {
          headers: {
            Accept: "application/json",
            "Girder-Token": this.girderToken,
          },
        }
      );

      const result = {
        id: data._id,
        name: data.name,
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
      const { data } = await axios.get(
        `${config.DSA_HOST}/api/v1/group?text=${groupName}&exact=false&limit=50&sort=name&sortdir=1`,
        {
          headers: {
            Accept: "application/json",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async addUserToGroup(groupId: string, _userId: string) {
    try {
      const { data } = await axios.post(
        `${config.DSA_HOST}/api/v1/group/${groupId}/invitation`,
        { userId: _userId, force: true, level: 0 },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    try {
      const { data } = await axios.delete(
        `${config.DSA_HOST}/api/v1/group/${groupId}/member?userId=${userId}`,
        {
          headers: {
            Accept: "application/json",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }

  async changeUserPassword(_userId: string, securePassword: string) {
    try {
      const newPassword = new URLSearchParams();
      newPassword.append("password", securePassword);

      const { data } = await axios.put(
        `${config.DSA_HOST}/api/v1/user/${_userId}/password`,
        newPassword.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Girder-Token": this.girderToken,
          },
        }
      );

      return data;
    } catch (error) {
      ManageAxiosError(error);
    }
  }
}
