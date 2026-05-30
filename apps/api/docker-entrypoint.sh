#!/bin/sh
# ============================================================================
# Точка входа API-контейнера:
#  1) синхронизирует схему БД (prisma db push — без файлов миграций);
#  2) наполняет демо-данными, только если база пуста;
#  3) запускает сервер.
# ============================================================================
set -e

echo "→ Синхронизация схемы базы данных…"
npx prisma db push --skip-generate --accept-data-loss

# Сидируем только пустую БД, чтобы не затирать данные при рестартах.
USER_COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then((c)=>{process.stdout.write(String(c));return p.\$disconnect();}).catch(()=>{process.stdout.write('0');});" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "→ База пуста — наполняем демо-данными…"
  npm run db:seed || echo "⚠ Сидирование пропущено"
else
  echo "→ В базе уже есть данные ($USER_COUNT польз.) — пропускаем сид."
fi

echo "→ Запуск TechIntern API…"
exec node dist/main.js
