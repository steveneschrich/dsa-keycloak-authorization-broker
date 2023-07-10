# Authorization Broker for DSA and Keycloak

Microservice for managing authorization and authentication for DSA and Keycloak

## Requirements

- Node `v16.19.1`

## Installation

Make sure that you have your `config.env` set with all the required variables (check the `config.env.template` file)

1.  Run `npm i`
2.  Run `npm run build`
3.  Run `npm run start`

## Config.env

```
DSA_HOST=
DSA_AUTH_TOKEN=
# DSA ADMIN USERNAME AND PASSWORD
DSA_USERNAME=
DSA_PASSWORD=
KEYCLOAK_HOST=
# KEYCLAOK USERNAME AND PASSWORD
KEYCLOAK_USER=
KEYCLOAK_PASSWORD=
KEYCLOAK_REALM=
KEYCLOAK_CLIENT=
LOG_ENABLED=true
LOG_LEVEL=
APP_ID=broker
APP_PORT=8085
APP_HOST="0.0.0.0"
```