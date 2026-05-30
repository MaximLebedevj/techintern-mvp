# CLAUDE.md — TechIntern Engineering Handbook

> **TechIntern** — специализированная платформа для поиска стажировок и первой работы
> студентами IT‑специальностей. Этот документ — единый источник правды по архитектуре,
> стандартам кода и принципам дизайна. Любой код в репозитории обязан ему соответствовать.

---

## 1. Что мы строим

Двусторонний маркетплейс «студент ↔ компания» с упором на **глубокий поиск по технологиям**,
**подготовку к собеседованиям** и **AI‑скоринг кандидатов**.

Ключевые продуктовые сущности:

- **Студент** — профиль, интерактивное **Skill Tree**, отклики, прогресс по Career Hub.
- **Компания** — профиль, вакансии (только intern/junior), просмотр кандидатов с **match‑score**.
- **Вакансия** — точный стек (React + TypeScript, а не «Frontend»), город, формат, уровень.
- **Отклик (Application)** — со статус‑трекером `⏳ На рассмотрении → ✅ Приглашение → 🎯 Оффер`.
- **Career Hub** — 7+ гайдов, чеклисты, интерактивные разборы кода (React/Python).
- **Matching** — TF‑IDF + cosine similarity между профилем студента и требованиями вакансии.

---

## 2. Монорепозиторий

Управляется **Turborepo** + npm workspaces.

```
techintern/
├── apps/
│   ├── api/    # NestJS + Prisma + PostgreSQL + Redis  (порт 4000)
│   └── web/    # React 18 + Vite + Tailwind + shadcn/ui (порт 5173)
├── turbo.json
├── package.json          # workspaces, общие скрипты
├── tsconfig.base.json    # базовый strict TS-конфиг
├── docker-compose.yml
└── README.md
```

Принцип: **apps самодостаточны**. Мы намеренно не выносим shared‑пакет типов, чтобы
монорепо запускался без промежуточной сборки пакетов. Контракт API дублируется в `web/src/types`
и держится в синхроне вручную (MVP‑компромисс, задокументирован осознанно).

Команды (из корня):

```bash
npm install            # установить всё
npm run dev            # turbo: api + web параллельно
npm run build          # сборка всех приложений
npm run lint           # eslint во всех пакетах
npm run format         # prettier --write
```

---

## 3. Общие стандарты кода

### Язык и типобезопасность
- **TypeScript strict** везде. `any` запрещён; в крайнем случае `unknown` + сужение типа.
- Никаких `// @ts-ignore` без комментария‑обоснования рядом.
- Публичные контракты (DTO, типы ответов) — явно типизированы, не выводятся неявно.

### Именование
- Файлы: `kebab-case.ts`. React‑компоненты: `PascalCase.tsx`.
- Типы/классы/интерфейсы: `PascalCase`. Переменные/функции: `camelCase`. Константы‑синглтоны: `SCREAMING_SNAKE_CASE`.
- Булевы: префикс `is/has/should/can` (`isLoading`, `hasOffer`).

### Структура и чистота
- Одна ответственность на модуль/функцию. Функции — короткие, без скрытых сайд‑эффектов.
- Ранний `return` вместо вложенных `if`. Глубина вложенности ≤ 3.
- Комментарии объясняют **«почему»**, а не «что». Бизнес‑правила комментируем на русском.
- Магические числа выносим в именованные константы.

### Ошибки
- Backend: доменные ошибки → HTTP через NestJS exception filter; не глотаем исключения.
- Frontend: ошибки запросов обрабатываются на уровне TanStack Query + toast; нет «пустых» catch.

### Форматирование
- Prettier — единственный источник истины (см. `.prettierrc`). ESLint не конфликтует с Prettier.
- Импорты сгруппированы: внешние → алиасы (`@/…`) → относительные.

---

## 4. Backend — `apps/api` (NestJS, Clean Architecture / DDD‑lite)

### Слои
Применяем **прагматичный DDD**: богатый домен там, где это создаёт ценность (матчинг,
скоринг, статусы откликов), и тонкие сервисы для CRUD.

```
src/
├── main.ts                 # bootstrap: security, validation, swagger, cors
├── app.module.ts
├── config/                 # типизированная конфигурация (env → объект)
├── common/                 # кросс-слойное: guards, decorators, filters, interceptors, dto
├── infra/
│   ├── prisma/             # PrismaService (persistence)
│   └── redis/              # RedisService (cache, refresh-token store)
└── modules/<context>/
    ├── <context>.module.ts
    ├── <context>.controller.ts     # HTTP — тонкий, только маршрутизация + DTO
    ├── <context>.service.ts        # application layer — оркестрация use-case'ов
    ├── domain/                     # доменная логика (value objects, политики) — где нужно
    ├── dto/                        # zod-less: class-validator DTO (request/response)
    └── ...
```

Bounded contexts: `auth`, `users`, `students`, `companies`, `vacancies`,
`applications`, `skills`, `career-hub`, `matching`.

### Правила
- **Контроллер ничего не решает** — валидирует вход (DTO + `ValidationPipe`), вызывает сервис, маппит ответ.
- **Сервис** — единица бизнес‑логики; не знает про `Request/Response`.
- **Доступ к БД только через `PrismaService`**. Никаких сырых запросов в контроллерах.
- DTO для входа — `class-validator`/`class-transformer`. Ответы — явные response‑типы (без утечки полей вроде `passwordHash`).
- Каждый защищённый эндпоинт — за `JwtAuthGuard` (+ `RolesGuard` где нужно). Публичные помечаются `@Public()`.
- Идемпотентность и пагинация для списков (`?page&limit`), фильтры — типизированные query‑DTO.

### Аутентификация и безопасность
- **JWT access** (короткий TTL, 15m) + **refresh** (длинный TTL, 7d). Refresh хранится хешированным в Redis (rotation + revoke).
- Пароли — `argon2` (предпочтительно) или `bcrypt`, cost ≥ 12. Пароль никогда не покидает backend.
- **OAuth2**: Google + GitHub через `passport` стратегии; при первом входе создаётся `User(provider=…)`.
- Helmet, CORS all‑list, rate‑limit (`@nestjs/throttler`) на auth‑эндпоинтах.
- Секреты — только из env. В репозитории — `.env.example` без реальных значений.

### Матчинг (доменное ядро)
- Чистая, тестируемая функция: `cosineSimilarity(tfidf(profile), tfidf(vacancy))`.
- Учитываем: точные технологии, уровень (Junior/Middle), проекты, образование.
- Возвращаем `score 0–100` **и объяснение** («Добавьте Redux — +15%»). Объяснимость — обязательна.
- Результаты кешируются в Redis по ключу `match:{vacancyId}:{studentId}`.

### Prisma
- Единая схема `prisma/schema.prisma`. Миграции через `prisma migrate`.
- Enum'ы для статусов/ролей/форматов. Связи — явные, с `onDelete` политиками.
- Сид (`prisma/seed.ts`) наполняет демо‑данные: навыки, гайды, вакансии, демо‑аккаунты.

---

## 5. Frontend — `apps/web` (React 18 + Vite)

### Стек и роли
- **React Router v7** (data router) — маршрутизация, layout‑routes, защита приватных зон.
- **TanStack Query v5** — серверное состояние (запросы/мутации/кеш/инвалидация). Никаких ручных `useEffect(fetch)`.
- **Zustand** — клиентское состояние (auth‑сессия, тема, UI‑флаги). Минимально и точечно.
- **React Hook Form + Zod** — все формы; единый `zodResolver`. Валидация = единый источник истины.
- **shadcn/ui + Radix + lucide-react** — UI‑примитивы (в `components/ui`), доступные и стилизуемые.
- **Tailwind CSS** — единственный способ стилизации. Никаких inline‑стилей, кроме динамических величин.
- **framer-motion** — микро‑взаимодействия и переходы (там, где уместно, без перегруза).

### Структура
```
src/
├── main.tsx / App.tsx
├── index.css                 # tailwind + дизайн-токены (CSS variables)
├── lib/                      # api-client (axios), query-client, utils (cn), constants
├── types/                    # типы API-контракта (зеркало backend)
├── stores/                   # zustand: auth, theme
├── hooks/                    # use-auth, use-vacancies, use-applications, ...
├── components/
│   ├── ui/                   # shadcn-примитивы
│   ├── layout/               # AppShell, Sidebar, Topbar, ThemeToggle
│   └── <feature>/            # SkillTree, VacancyCard, StatusTracker, CodeReview, MatchScore...
├── pages/                    # маршрутные экраны
└── routes/                   # описание роутера + guard'ы
```

### Правила компонентов
- Функциональные компоненты + хуки. Презентационные и контейнерные разделяем.
- Данные с сервера — только через хуки‑обёртки над `useQuery/useMutation` в `hooks/`.
- Никакой бизнес‑логики в JSX — выносим в хуки/utils. Компонент описывает **что**, не «как».
- Доступность: семантические теги, `aria-*`, фокус‑стили, навигация с клавиатуры.
- Списки — со `skeleton`‑состояниями и пустыми состояниями (empty states), не «голый» спиннер.

---

## 6. Дизайн‑система (премиум: уровень Linear / Vercel / Arc)

> Цель — ощущение дорогого, спокойного, «дышащего» продукта. Сдержанность важнее декора.

### Токены
- Цвета через **HSL CSS‑переменные** (`--background`, `--foreground`, `--primary`, …) с тёмной/светлой темами.
- Бренд: глубокий **индиго→виолет** градиент для акцентов; нейтральная шкала — холодный slate.
- Радиусы: базовый `--radius: 0.75rem`. Карточки — `rounded-2xl`. Кнопки — `rounded-xl`.

### Типографика
- UI‑шрифт **Inter** (`font-feature-settings: 'cv11','ss01'`), дисплей‑заголовки — **Manrope/Inter tight**.
- Чёткая иерархия: `text-4xl/tight` хедлайны, `text-sm` мета. Межстрочный воздух, `tracking-tight` для крупного.

### Глубина и стекло
- Многослойные мягкие тени (`shadow-sm` → кастомные «elevation» утилиты), 1px бордеры на `--border`.
- **Glassmorphism** на topbar/sidebar/модалках: `backdrop-blur-xl` + полупрозрачный фон + тонкий бордер.
- Тонкие градиентные «свечения» (radial glow) на hero/CTA, аккуратно и приглушённо.

### Движение
- `framer-motion`: появление списков (stagger), hover‑lift карточек, плавные переходы статусов.
- Длительности 150–300ms, easing «ease‑out». Уважать `prefers-reduced-motion`.

### Темизация
- Тумблер light/dark + системная тема. Переключение без «вспышки» (класс на `<html>`, init‑скрипт).

### Язык интерфейса
- **Весь UI — на русском.** Тексты, плейсхолдеры, кнопки, тосты, ошибки, пустые состояния, даты (ru‑RU).
- Тон — профессиональный, тёплый, поддерживающий (мы «карьерный наставник», а не сухой job‑board).

---

## 7. Качество, тесты, безопасность

- **Адаптивность mobile‑first**: проверяем 360 / 768 / 1024 / 1440. Ничего не «ломается» и не обрезается.
- Защита от XSS: пользовательский контент не вставляем как HTML без санитайза.
- Никаких секретов/токенов в логах и в localStorage без необходимости (access — в памяти, refresh — httpOnly cookie / secure storage).
- Производительность: code‑split по маршрутам, мемоизация тяжёлых списков, дебаунс поиска.
- Коммиты — атомарные, по смыслу. Сообщения — императив, по‑русски или по‑английски, без мусора.

---

## 8. Definition of Done для фичи

1. Соответствует требованиям из доклада (раздел продукта выше).
2. Типобезопасна, проходит `lint` и `build`.
3. Имеет состояния: loading / empty / error / success.
4. Адаптивна и работает в light/dark.
5. Тексты — на русском, доступность не сломана.
6. Не протекают секреты и приватные поля; защищённые маршруты закрыты guard'ами.
