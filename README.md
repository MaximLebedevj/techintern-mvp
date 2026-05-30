<div align="center">

# 🎓 TechIntern

**Специализированная платформа поиска стажировок и первой работы для студентов IT‑специальностей.**

Глубокий поиск по технологиям · Career Hub с разборами кода · AI‑подбор кандидатов (TF‑IDF + cosine similarity) · трекер откликов

React 18 · TypeScript · Vite · Tailwind · shadcn/ui · NestJS · Prisma · PostgreSQL · Redis · Docker

</div>

---

## 📖 О проекте

TechIntern — двусторонний маркетплейс «студент ↔ компания». Он решает ключевые боли рынка:
информационный шум, завышенные требования к опыту и отсутствие подготовки к собеседованиям.

**Для студентов**
- Регистрация / вход (email + OAuth Google/GitHub)
- Профиль с интерактивным **Skill Tree** (прогресс по направлениям и рекомендации)
- **Глубокий поиск** вакансий по точному стеку (`React + TypeScript`, `Python + Django` …)
- Отклики с красивым **статус‑трекером** `⏳ На рассмотрении → ✅ Приглашение → 🎯 Оффер`
- **Career Hub**: 9 материалов — гайды, чеклисты и интерактивные разборы кода (React/Python)

**Для компаний**
- Регистрация и профиль компании
- Публикация junior/стажёрских вакансий
- Просмотр кандидатов с рабочим **AI‑match score** (объяснимый: «Добавьте Redux — +15%»)
- Дашборд с метриками и воронкой откликов
- Чат с кандидатами

---

## 🧱 Технологический стек

| Слой        | Технологии |
|-------------|-----------|
| Monorepo    | Turborepo + npm workspaces |
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, lucide-react, Zustand, React Hook Form + Zod, TanStack Query, React Router v7, framer-motion |
| Backend     | NestJS, Prisma ORM, PostgreSQL, Redis, Passport (JWT + OAuth2), class-validator, Swagger |
| Безопасность| JWT access (15m) + refresh (7d, ротация в Redis), bcrypt, Helmet, CORS, rate-limit |
| AI-матчинг  | TF-IDF + косинусная близость (чистые, тестируемые функции) |
| Инфра       | Docker, docker-compose, Nginx, Certbot (SSL) |

---

## 📂 Структура монорепозитория

```
techintern/
├── apps/
│   ├── api/                 # NestJS + Prisma (порт 4000)
│   │   ├── prisma/          # schema.prisma + seed.ts (демо-данные)
│   │   └── src/
│   │       ├── common/      # guards, decorators, filters, dto
│   │       ├── config/      # типизированная конфигурация
│   │       ├── infra/       # PrismaService, RedisService
│   │       └── modules/     # auth, students, companies, vacancies,
│   │                        # applications, skills, career-hub,
│   │                        # matching, messages
│   └── web/                 # React + Vite (порт 5173 / 8080 в Docker)
│       └── src/
│           ├── components/  # ui (shadcn), layout, features
│           ├── hooks/       # обёртки над TanStack Query
│           ├── pages/       # маршрутные экраны
│           ├── routes/      # роутер + guard'ы
│           ├── stores/      # zustand (auth, theme)
│           └── lib/         # api-client, schemas, utils
├── nginx/techintern.conf    # reverse-proxy для VPS (TLS)
├── docker-compose.yml
├── turbo.json
└── README.md
```

---

## 🚀 Быстрый старт через Docker (рекомендуется)

Нужен только **Docker** с плагином **Compose**.

```bash
# 1. Перейти в папку проекта
cd TechIntern-MVP

# 2. Создать .env из примера (значений по умолчанию достаточно для локали)
cp .env.example .env

# 3. Поднять весь стек (БД, Redis, API, фронт)
docker compose up -d --build
```

При первом запуске API автоматически:
1. синхронизирует схему БД (`prisma db push`);
2. наполняет демо‑данными (только если база пуста).

Откройте: **http://localhost:8080**

| URL | Назначение |
|-----|-----------|
| http://localhost:8080 | Приложение |
| http://localhost:8080/docs | Swagger (документация API) |

Полезные команды:

```bash
docker compose logs -f api      # логи backend
docker compose exec api npm run db:seed   # пере-сидировать вручную
docker compose down             # остановить
docker compose down -v          # остановить и удалить данные (volumes)
```

### 🔑 Демо‑аккаунты (пароль у всех: `password123`)

| Роль     | Email |
|----------|-------|
| Студент  | `student@techintern.ru` |
| Компания | `company@techintern.ru` |

> Флагманский пример из доклада уже в данных: студент Алексей (React + TypeScript) имеет
> высокий match‑score к вакансии «Frontend‑разработчик (React + TypeScript)».

---

## 🛠️ Локальная разработка (без Docker)

Требуется **Node.js ≥ 20**, запущенные **PostgreSQL** и **Redis**.

```bash
# 1. Установить зависимости (из корня — npm workspaces)
npm install

# 2. Поднять только БД и Redis через Docker (удобно)
docker compose up -d postgres redis

# 3. Настроить переменные API
cp apps/api/.env.example apps/api/.env
# DATABASE_URL и REDIS_URL по умолчанию указывают на localhost — ок

# 4. Применить схему к БД и наполнить демо-данными
npm run db:push --workspace=@techintern/api
npm run db:seed

# 5. Запустить фронт и бэк параллельно (Turborepo)
npm run dev
```

| Сервис | URL |
|--------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (NestJS)| http://localhost:4000 |
| Swagger         | http://localhost:4000/docs |

Vite проксирует `/api` на backend, поэтому отдельный CORS‑конфиг для дев‑режима не нужен.

### Команды (из корня)

```bash
npm run dev        # turbo: api + web
npm run build      # сборка всех приложений
npm run lint       # eslint
npm run format     # prettier --write
npm run db:studio  # Prisma Studio (визуальный редактор БД)
```

---

## 🔐 OAuth2 (Google / GitHub) — необязательно

Кнопки соц‑входа появляются автоматически, только если заданы ключи.

1. **Google:** [Google Cloud Console](https://console.cloud.google.com/) → OAuth client →
   Redirect URI: `http://localhost:8080/api/auth/google/callback`
2. **GitHub:** Settings → Developer settings → OAuth Apps →
   Callback URL: `http://localhost:8080/api/auth/github/callback`
3. Заполните в `.env`: `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` и перезапустите.

На проде замените домен и протокол (`https://your-domain.com/api/auth/...`).

---

## ☁️ Деплой на Ubuntu VPS (Docker + Nginx + SSL)

Пошагово для чистого Ubuntu 22.04+.

### 1. Подготовка сервера

```bash
sudo apt update && sudo apt upgrade -y

# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER       # перелогиньтесь после этого

# Nginx + Certbot (на хосте — для TLS)
sudo apt install -y nginx certbot python3-certbot-nginx git
```

### 2. Код и переменные окружения

```bash
git clone <ваш-репозиторий> techintern && cd techintern
cp .env.example .env
nano .env
```

Обязательно поменяйте на проде:

```env
POSTGRES_PASSWORD=<сильный-пароль>
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
COOKIE_SECURE=true                       # работаем по HTTPS
APP_PUBLIC_URL=https://your-domain.com
API_PUBLIC_URL=https://your-domain.com
WEB_PORT=8080                            # внутренний порт web-контейнера
```

### 3. Запуск контейнеров

```bash
docker compose up -d --build
docker compose ps          # все сервисы должны быть healthy/up
```

Web‑контейнер слушает `127.0.0.1:8080` и сам раздаёт SPA + проксирует `/api`.

### 4. Настройка хостового Nginx

```bash
sudo cp nginx/techintern.conf /etc/nginx/sites-available/techintern.conf
sudo sed -i 's/your-domain.com/ВАШ_ДОМЕН/g' /etc/nginx/sites-available/techintern.conf
sudo ln -s /etc/nginx/sites-available/techintern.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl reload nginx
```

> Перед выпуском сертификата убедитесь, что A‑запись домена указывает на IP сервера.

### 5. SSL через Let's Encrypt

```bash
sudo certbot --nginx -d ВАШ_ДОМЕН -d www.ВАШ_ДОМЕН
```

Certbot сам пропишет сертификаты и HTTPS‑редирект. Автопродление:

```bash
sudo systemctl status certbot.timer   # таймер уже активен
sudo certbot renew --dry-run           # проверка продления
```

### 6. Обновление приложения

```bash
git pull
docker compose up -d --build
```

### Бэкап БД

```bash
docker compose exec postgres pg_dump -U techintern techintern > backup_$(date +%F).sql
```

---

## 🧠 Как работает AI‑матчинг

Доменное ядро (`apps/api/src/modules/matching`) — чистые, тестируемые функции:

1. Навыки студента, технологии проектов и требования вакансии проецируются в общее
   **токен‑пространство**.
2. Токены взвешиваются по **IDF** (редкие навыки ценнее), считается **косинусная близость**.
3. Дополнительно учитываются текстовая близость и соответствие уровня/опыта.
4. Результат **объясним**: совпавшие навыки, чего не хватает и сколько даст добор
   («Добавьте Redux — +15%»).

Результаты кешируются в Redis по ключу `match:{vacancyId}:{studentId}`.

---

## ✅ Реализованные требования из доклада

- [x] Регистрация/вход (email + OAuth Google/GitHub)
- [x] Интерактивное Skill Tree с прогресс‑барами и рекомендациями
- [x] Глубокий поиск по технологиям (точный стек) + фильтры
- [x] Отклики + статус‑трекер `⏳ → ✅ → 🎯`
- [x] Career Hub: гайды, чеклисты, интерактивные разборы кода (React useEffect, Python)
- [x] Компании: публикация вакансий, просмотр кандидатов, AI‑match score
- [x] Премиум‑дизайн, тёмная/светлая тема, mobile‑first, весь UI на русском

---

<div align="center">
TechIntern — это не просто job‑board, а карьерный наставник для студентов IT. 💜
</div>
