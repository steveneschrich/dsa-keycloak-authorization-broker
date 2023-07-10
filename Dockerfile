FROM node:fermium-alpine AS base
LABEL Description="Dockerfile for MOFFITT Projects using NodeJS"
WORKDIR "/app"

FROM base AS deps
COPY package.json /app/
COPY pacakage-lock.json /app/

FROM deps AS prodbase
COPY . /app/
RUN npm ci --only=production

FROM deps AS dev
COPY . /app/
RUN npm run build

FROM prodbase AS prod
COPY config /app/config
COPY --from=dev --chown=node /app/dist/ /app/dist/
COPY --from=prodbase --chown=node /app/node_modules/ /app/node_modules/ /
COPY --from=dev --chown=node /app/tsconfig.js /app/tsconfig.js
USER node
CMD ["node", "dist/src/index.js"]
EXPOSE 8085