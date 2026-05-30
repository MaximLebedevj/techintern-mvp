# syntax=docker/dockerfile:1
# ============================================================================
# TechIntern Web — сборка SPA (Vite) + раздача через nginx
# Контекст сборки: ./apps/web
# Фронт ходит на относительный /api (nginx проксирует на api-сервис).
# ============================================================================

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# VITE_API_URL пуст → клиент использует относительный /api (один origin)
ENV VITE_API_URL=""
RUN npm run build

# ----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
