FROM node:25-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Development
FROM base AS development
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "start:dev"]

# Builder
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production
FROM node:25-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/drizzle ./drizzle

USER appuser

EXPOSE 5000

CMD ["node", "dist/src/main.js"]
