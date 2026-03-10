FROM node:25-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Dev

FROM base AS development
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "start:dev"]

# Builder

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build;

# Prod
FROM node:25-alpine AS production
RUN npm install -g pnpm

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --chown=appuser:appgroup package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

USER appuser

EXPOSE 5000
CMD ["node", "dist/src/main.js"]
