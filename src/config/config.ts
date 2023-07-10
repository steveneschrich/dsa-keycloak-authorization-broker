import path from "path";
import dotenv from "dotenv";

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "../../../config/config.env") });
// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  DSA_HOST: string | undefined;
  DSA_USERNAME: string | undefined;
  DSA_PASSWORD: string | undefined;
  DSA_AUTH_TOKEN: string | undefined;
  KEYCLOAK_HOST: string | undefined;
  KEYCLOAK_USER: string | undefined;
  KEYCLOAK_PASSWORD: string | undefined;
  KEYCLOAK_REALM: string | undefined;
  KEYCLOAK_CLIENT: string | undefined;
  LOG_LEVEL: string | undefined;
  LOG_ENABLED: string | undefined;
  APP_ID: string | undefined;
  APP_PORT: number | undefined;
  APP_HOST: string | undefined;
}

interface Config {
  DSA_HOST: string;
  DSA_AUTH_TOKEN: string;
  DSA_USERNAME: string;
  DSA_PASSWORD: string;
  KEYCLOAK_HOST: string;
  KEYCLOAK_USER: string;
  KEYCLOAK_PASSWORD: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT: string;
  LOG_LEVEL: string;
  LOG_ENABLED: string;
  APP_ID: string;
  APP_PORT: number;
  APP_HOST: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    DSA_HOST: process.env.DSA_HOST,
    DSA_AUTH_TOKEN: process.env.DSA_AUTH_TOKEN,
    DSA_USERNAME: process.env.DSA_USERNAME,
    DSA_PASSWORD: process.env.DSA_PASSWORD,
    KEYCLOAK_HOST: process.env.KEYCLOAK_HOST,
    KEYCLOAK_USER: process.env.KEYCLOAK_USER,
    KEYCLOAK_PASSWORD: process.env.KEYCLOAK_PASSWORD,
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
    KEYCLOAK_CLIENT: process.env.KEYCLOAK_CLIENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_ENABLED: process.env.LOG_ENABLED,
    APP_ID: process.env.APP_ID,
    APP_PORT: parseInt(process.env.APP_PORT ? process.env.APP_PORT : "8085"),
    APP_HOST: process.env.APP_HOST,
  };
};

// Throwing an Error if any field was undefined we don't
// want our app to run if it can't connect to DB and ensure
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;
