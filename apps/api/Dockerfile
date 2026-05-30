# syntax=docker/dockerfile:1
# ============================================================================
# TechIntern API — multi-stage build (NestJS + Prisma)
# Контекст сборки: ./apps/api
# ============================================================================

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Зависимости (используем кеш слоёв: сначала только манифест).
COPY package.json ./
RUN npm install

# Prisma client (генерируется до сборки TS).
COPY prisma ./prisma
RUN npx prisma generate

# Исходники и сборка.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# openssl нужен Prisma engine в рантайме.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Переносим зависимости и артефакты (prisma CLI оставляем для migrate/seed).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
