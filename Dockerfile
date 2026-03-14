# Base
FROM node:25-alpine AS base

RUN npm install -g pnpm

# Crear usuario no-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

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
FROM base AS production

WORKDIR /app

RUN pnpm install --frozen-lockfile --prod

COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/drizzle ./drizzle

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "dist/src/main.js"]
