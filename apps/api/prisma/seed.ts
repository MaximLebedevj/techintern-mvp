/* eslint-disable no-console */
/**
 * Сид демо-данных TechIntern.
 * Наполняет Skill Tree, Career Hub (включая разборы кода из доклада),
 * демо-компании, студентов, вакансии и отклики со статус-трекером.
 *
 * Демо-входы (пароль у всех): password123
 *   • Студент:  student@techintern.ru
 *   • Компания: company@techintern.ru
 */
import {
  ApplicationStatus,
  CompanyPlan,
  CompanySize,
  EmploymentType,
  PrismaClient,
  ResourceType,
  Role,
  SeniorityLevel,
  SkillCategory,
  VacancyStatus,
  WorkFormat,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

// --- Дерево навыков ----------------------------------------------------------

interface SkillSeed {
  name: string;
  slug: string;
  icon?: string;
  children?: SkillSeed[];
}
interface RootSeed extends SkillSeed {
  category: SkillCategory;
}

const SKILL_ROOTS: RootSeed[] = [
  {
    name: 'Frontend',
    slug: 'frontend',
    icon: 'Layout',
    category: SkillCategory.FRONTEND,
    children: [
      { name: 'HTML / CSS', slug: 'html-css', icon: 'Code' },
      { name: 'JavaScript', slug: 'javascript', icon: 'Braces' },
      {
        name: 'React + TypeScript',
        slug: 'react-typescript',
        icon: 'Atom',
        children: [
          { name: 'Hooks', slug: 'react-hooks' },
          { name: 'State Management', slug: 'state-management' },
          { name: 'Performance', slug: 'react-performance' },
        ],
      },
      { name: 'Next.js', slug: 'nextjs', icon: 'Triangle' },
      { name: 'Vue.js', slug: 'vuejs', icon: 'Component' },
    ],
  },
  {
    name: 'Backend',
    slug: 'backend',
    icon: 'Server',
    category: SkillCategory.BACKEND,
    children: [
      { name: 'Node.js + NestJS', slug: 'nodejs-nestjs', icon: 'Hexagon' },
      { name: 'Python + Django', slug: 'python-django', icon: 'Snake' },
      { name: 'PostgreSQL', slug: 'postgresql', icon: 'Database' },
      { name: 'REST API', slug: 'rest-api', icon: 'Network' },
      { name: 'Redis', slug: 'redis', icon: 'Zap' },
    ],
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    icon: 'LineChart',
    category: SkillCategory.DATA_SCIENCE,
    children: [
      { name: 'Python', slug: 'python', icon: 'Snake' },
      { name: 'Pandas / NumPy', slug: 'pandas-numpy', icon: 'Table' },
      { name: 'Machine Learning', slug: 'machine-learning', icon: 'BrainCircuit' },
      { name: 'SQL', slug: 'sql', icon: 'Database' },
    ],
  },
  {
    name: 'DevOps',
    slug: 'devops',
    icon: 'Settings',
    category: SkillCategory.DEVOPS,
    children: [
      { name: 'Docker', slug: 'docker', icon: 'Container' },
      { name: 'CI/CD', slug: 'ci-cd', icon: 'GitBranch' },
      { name: 'Kubernetes', slug: 'kubernetes', icon: 'Boxes' },
      { name: 'Linux', slug: 'linux', icon: 'Terminal' },
    ],
  },
  {
    name: 'Mobile',
    slug: 'mobile',
    icon: 'Smartphone',
    category: SkillCategory.MOBILE,
    children: [
      { name: 'React Native', slug: 'react-native', icon: 'Atom' },
      { name: 'Flutter', slug: 'flutter', icon: 'Feather' },
      { name: 'Kotlin', slug: 'kotlin', icon: 'Smartphone' },
    ],
  },
  {
    name: 'Основы',
    slug: 'fundamentals',
    icon: 'GraduationCap',
    category: SkillCategory.FUNDAMENTALS,
    children: [
      { name: 'Алгоритмы и структуры данных', slug: 'algorithms', icon: 'Binary' },
      { name: 'Git', slug: 'git', icon: 'GitBranch' },
      { name: 'ООП', slug: 'oop', icon: 'Boxes' },
    ],
  },
];

const slugToId = new Map<string, string>();

async function seedSkillTree(
  nodes: SkillSeed[],
  category: SkillCategory,
  parentId: string | null = null,
): Promise<void> {
  let order = 0;
  for (const node of nodes) {
    const created = await prisma.skill.create({
      data: {
        name: node.name,
        slug: node.slug,
        category,
        icon: node.icon ?? null,
        parentId,
        sortOrder: order++,
      },
    });
    slugToId.set(node.slug, created.id);
    if (node.children?.length) {
      await seedSkillTree(node.children, category, created.id);
    }
  }
}

const skillId = (slug: string): string => {
  const id = slugToId.get(slug);
  if (!id) throw new Error(`Неизвестный навык: ${slug}`);
  return id;
};

// --- Career Hub --------------------------------------------------------------

async function seedCareerHub(): Promise<void> {
  await prisma.careerResource.createMany({
    data: [
      {
        slug: 'self-presentation',
        type: ResourceType.GUIDE,
        title: 'Как рассказать о себе на собеседовании',
        summary:
          'Структура самопрезентации за 90 секунд: кто вы, что умеете и почему подходите именно этой команде.',
        category: 'Поведенческое интервью',
        tags: ['Собеседование', 'Soft skills', 'Самопрезентация'],
        readMinutes: 6,
        icon: 'Mic',
        featured: true,
        sortOrder: 1,
        content: [
          '## Формула удачного рассказа о себе',
          '',
          'Рекрутёр почти всегда начинает с просьбы «расскажите о себе». Это не светская беседа, а возможность задать рамку всему интервью.',
          '',
          '### Структура «Настоящее → Прошлое → Будущее»',
          '1. **Настоящее.** Кто вы сейчас: «Студент 3 курса, Frontend-направление, последние полгода углублённо изучаю React и TypeScript».',
          '2. **Прошлое.** Релевантный опыт и проекты: «Сделал 3 pet-проекта, один — командный на хакатоне».',
          '3. **Будущее.** Почему эта компания: «Хочу расти во Frontend в продуктовой команде — у вас как раз сильная инженерная культура».',
          '',
          '### Чего избегать',
          '- Пересказа резюме строчка за строчкой.',
          '- Перечисления личных качеств без примеров («ответственный, коммуникабельный»).',
          '- Рассказа длиннее 2 минут.',
          '',
          '> Подготовьте 60–90-секундную версию и потренируйтесь вслух 5–7 раз.',
        ].join('\n'),
      },
      {
        slug: 'behavioral-star',
        type: ResourceType.GUIDE,
        title: 'Поведенческие вопросы: метод STAR',
        summary:
          'Как отвечать на «расскажите о ситуации, когда…» так, чтобы ответ звучал structured и убедительно.',
        category: 'Поведенческое интервью',
        tags: ['Собеседование', 'STAR', 'Soft skills'],
        readMinutes: 7,
        icon: 'Star',
        featured: true,
        sortOrder: 2,
        content: [
          '## Метод STAR',
          '',
          'STAR помогает отвечать на поведенческие вопросы без воды и в логичном порядке.',
          '',
          '- **S — Situation.** Контекст: где и когда это было.',
          '- **T — Task.** Какая стояла задача и ваша роль.',
          '- **A — Action.** Что конкретно **вы** сделали (не «мы»).',
          '- **R — Result.** Измеримый результат и выводы.',
          '',
          '### Пример',
          '> «На хакатоне (S) за ночь нужно было собрать MVP (T). Я взял на себя интеграцию API и настройку CI (A). Мы заняли 2 место, а CI сократил время сборки с 8 до 2 минут (R)».',
          '',
          '### Частые вопросы',
          '- Расскажите о конфликте в команде и как вы его решили.',
          '- Опишите ситуацию, когда вы ошиблись. Что сделали?',
          '- Когда вам пришлось быстро учиться новому?',
        ].join('\n'),
      },
      {
        slug: 'technical-interview',
        type: ResourceType.GUIDE,
        title: 'Что спросят на техническом интервью',
        summary:
          'Карта тем технического интервью для junior: от основ языка до системного мышления и live-coding.',
        category: 'Техническое интервью',
        tags: ['Собеседование', 'Алгоритмы', 'JavaScript', 'Python'],
        readMinutes: 9,
        icon: 'Terminal',
        featured: true,
        sortOrder: 3,
        content: [
          '## Из чего состоит техническое интервью',
          '',
          '### 1. Основы языка',
          '- JS: замыкания, event loop, `this`, прототипы, асинхронность.',
          '- Python: изменяемость, генераторы, контекстные менеджеры, GIL.',
          '',
          '### 2. Алгоритмы (junior-уровень)',
          '- Массивы и строки, хеш-таблицы, два указателя.',
          '- Оценка сложности O(n). Умейте проговаривать рассуждения вслух.',
          '',
          '### 3. Live-coding',
          '- Сначала уточните условие и крайние случаи, потом пишите код.',
          '- Проговаривайте ход мысли — интервьюеру важен процесс, а не только ответ.',
          '',
          '### 4. Вопросы по проектам',
          '- Будьте готовы защитить архитектурные решения своих pet-проектов.',
        ].join('\n'),
      },
      {
        slug: 'imposter-syndrome',
        type: ResourceType.GUIDE,
        title: 'Как побороть синдром самозванца',
        summary:
          '60% новичков сомневаются в себе перед собеседованием. Разбираем, как перевести тревогу в подготовку.',
        category: 'Психология',
        tags: ['Soft skills', 'Мотивация', 'Собеседование'],
        readMinutes: 5,
        icon: 'HeartPulse',
        featured: false,
        sortOrder: 4,
        content: [
          '## Синдром самозванца — это нормально',
          '',
          'Ощущение «я недостаточно хорош» испытывают даже senior-инженеры. Важно не убрать его полностью, а не дать ему мешать.',
          '',
          '### Что помогает',
          '- **Факты вместо эмоций.** Ведите список выполненных задач и пройденных тем.',
          '- **Сравнивайте с собой вчерашним**, а не с тимлидом из твиттера.',
          '- **Готовьтесь системно.** Уверенность — побочный продукт подготовки.',
          '- Помните: junior нанимают за **потенциал и обучаемость**, а не за всезнание.',
        ].join('\n'),
      },
      {
        slug: 'junior-resume',
        type: ResourceType.GUIDE,
        title: 'Резюме junior-разработчика, которое читают',
        summary:
          'Как собрать резюме без коммерческого опыта так, чтобы рекрутёр позвал на интервью.',
        category: 'Резюме',
        tags: ['Резюме', 'GitHub', 'Карьера'],
        readMinutes: 6,
        icon: 'FileText',
        featured: false,
        sortOrder: 5,
        content: [
          '## Резюме без опыта работы',
          '',
          '### Главное правило',
          'Проекты важнее списка технологий. Покажите, что вы умеете **доводить до результата**.',
          '',
          '### Структура',
          '1. Заголовок: «Frontend-разработчик (React, TypeScript)» — конкретный стек.',
          '2. О себе: 2–3 строки про направление и цель.',
          '3. Проекты: название, стек, ваша роль, ссылка на demo и репозиторий.',
          '4. Навыки: только то, что реально применяли.',
          '5. Образование и курсы.',
          '',
          '> Ссылка на GitHub с оформленными README ценится выше, чем абстрактные «знаю всё».',
        ].join('\n'),
      },
      {
        slug: 'interview-7-days-checklist',
        type: ResourceType.CHECKLIST,
        title: 'Подготовка за 7 дней до интервью',
        summary: 'Пошаговый план на неделю: что повторить, что собрать и как не перегореть.',
        category: 'Чеклисты',
        tags: ['Собеседование', 'План', 'Чеклист'],
        readMinutes: 4,
        icon: 'ListChecks',
        featured: true,
        sortOrder: 6,
        checklistItems: [
          'День 1: изучить компанию, продукт и стек вакансии',
          'День 2: повторить основы языка (JS/Python) и типичные вопросы',
          'День 3: прорешать 5–7 алгоритмических задач уровня easy/medium',
          'День 4: подготовить рассказ о себе по схеме «настоящее → прошлое → будущее»',
          'День 5: разобрать свои проекты — быть готовым защитить решения',
          'День 6: пробное интервью с другом или вслух перед зеркалом',
          'День 7: отдых, сон 8 часов, проверка техники и ссылки на звонок',
        ],
        content:
          'Распечатайте чеклист и отмечайте пункты. Готовность лучше всего лечит волнение.',
      },
      {
        slug: 'github-profile-checklist',
        type: ResourceType.CHECKLIST,
        title: 'Чеклист идеального GitHub-профиля',
        summary: 'Что проверить в профиле и репозиториях, прежде чем оставить ссылку рекрутёру.',
        category: 'Чеклисты',
        tags: ['GitHub', 'Резюме', 'Чеклист'],
        readMinutes: 4,
        icon: 'Github',
        featured: false,
        sortOrder: 7,
        checklistItems: [
          'Заполнен профиль: аватар, био, ссылки',
          'Закреплены 3–6 лучших репозиториев',
          'В каждом проекте — README с описанием, стеком и скриншотом',
          'Есть ссылки на живое demo (Vercel / Netlify)',
          'Понятные коммиты, нет закоммиченных секретов и .env',
          'Хотя бы один проект доведён до «продакшн-готовности»',
        ],
        content: 'GitHub — ваше техническое портфолио. Рекрутёры открывают его одним из первых.',
      },
      {
        slug: 'code-review-react-useeffect',
        type: ResourceType.CODE_REVIEW,
        title: 'React: useEffect и зависимости',
        summary:
          'Классическая ошибка с пустым массивом зависимостей и устаревшими замыканиями — и как сделать правильно.',
        category: 'Разбор кода',
        tags: ['React', 'Hooks', 'JavaScript', 'TypeScript'],
        readMinutes: 8,
        icon: 'Atom',
        featured: true,
        sortOrder: 8,
        language: 'tsx',
        badCode: [
          'useEffect(() => {',
          '  fetchData(id); // id может измениться, но эффект не перезапустится',
          '}, []); // пустой массив зависимостей',
        ].join('\n'),
        goodCode: [
          'useEffect(() => {',
          '  const controller = new AbortController();',
          '  fetchData(id, { signal: controller.signal });',
          '',
          '  // cleanup: отменяем запрос при размонтировании / смене id',
          '  return () => controller.abort();',
          '}, [id]); // явные зависимости',
        ].join('\n'),
        explanation: [
          '**Что не так с первым вариантом.**',
          '- Пустой массив зависимостей «замораживает» значение `id` — эффект использует устаревшее замыкание и не перезапустится при его смене.',
          '- Нет отмены запроса: при быстрой смене `id` или размонтировании возможны гонки и утечки памяти.',
          '',
          '**Почему второй вариант лучше.**',
          '- `[id]` в зависимостях — эффект перезапускается ровно тогда, когда нужно.',
          '- `AbortController` отменяет «висящий» запрос в cleanup-функции.',
          '- Линтер `react-hooks/exhaustive-deps` подсказывает пропущенные зависимости.',
        ].join('\n'),
        interviewerQuestions: [
          'Что произойдёт, если убрать массив зависимостей вовсе?',
          'Зачем нужна cleanup-функция в useEffect?',
          'Чем useEffect отличается от useLayoutEffect?',
          'Как избежать бесконечного цикла ререндеров?',
        ],
        content: 'Разберите оба варианта, затем попробуйте переписать свой код в редакторе.',
      },
      {
        slug: 'code-review-python-data',
        type: ResourceType.CODE_REVIEW,
        title: 'Python: эффективная обработка данных',
        summary:
          'Цикл с append против генераторов: как обрабатывать большие данные экономно и безопасно.',
        category: 'Разбор кода',
        tags: ['Python', 'Данные', 'Производительность'],
        readMinutes: 7,
        icon: 'Snake',
        featured: true,
        sortOrder: 9,
        language: 'python',
        badCode: [
          'data = []',
          'for item in large_list:',
          "    if item['status'] == 'active':",
          "        data.append(item['value'])",
          '# Неэффективно для больших данных, нет обработки ошибок',
        ].join('\n'),
        goodCode: [
          '# Генераторное выражение — ленивая обработка без промежуточного списка',
          'active_values = (',
          "    item['value']",
          '    for item in large_list',
          "    if item.get('status') == 'active'",
          ')',
          '',
          '# Считаем сразу, не материализуя список в память',
          'total = sum(active_values)  # или list(active_values) при необходимости',
        ].join('\n'),
        explanation: [
          '**Проблемы первого варианта.**',
          '- Промежуточный список `data` держит в памяти все элементы — больно на больших данных.',
          "- `item['status']` упадёт с `KeyError`, если ключа нет.",
          '',
          '**Почему второй вариант лучше.**',
          '- Генератор обрабатывает элементы лениво, по одному — память почти не растёт.',
          "- `item.get('status')` безопасно вернёт `None` при отсутствии ключа.",
          '- Можно сразу агрегировать (`sum`, `max`), не создавая список.',
        ].join('\n'),
        interviewerQuestions: [
          'В чём разница между списковым включением и генератором?',
          'Когда генератор предпочтительнее списка?',
          'Как безопасно обратиться к возможно отсутствующему ключу словаря?',
          'Что вернёт выражение-генератор, если его не итерировать?',
        ],
        content: 'Сравните потребление памяти обоих подходов на списке из 10 млн элементов.',
      },
    ],
  });
}

// --- Компании и вакансии -----------------------------------------------------

interface VacancySeed {
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  conditions: string[];
  city: string;
  workFormat: WorkFormat;
  employmentType: EmploymentType;
  level: SeniorityLevel;
  experienceYears: number;
  salaryMin?: number;
  salaryMax?: number;
  skills: { slug: string; required?: boolean; weight?: number }[];
}

interface CompanySeed {
  email: string;
  name: string;
  description: string;
  city: string;
  industry: string;
  size: CompanySize;
  plan: CompanyPlan;
  vacancies: VacancySeed[];
}

const COMPANIES: CompanySeed[] = [
  {
    email: 'company@techintern.ru',
    name: 'DevHorizon',
    description:
      'Продуктовая IT-компания: строим B2B-платформы аналитики. Любим стажёров и растим их до middle.',
    city: 'Москва',
    industry: 'SaaS / Аналитика',
    size: CompanySize.MEDIUM,
    plan: CompanyPlan.PREMIUM,
    vacancies: [
      {
        title: 'Frontend-разработчик (React + TypeScript)',
        description:
          'Ищем начинающего фронтендера в команду продукта. Будете развивать дашборды на React и TypeScript под руководством наставника.',
        responsibilities: [
          'Разрабатывать интерфейсы на React + TypeScript',
          'Верстать адаптивные страницы по макетам Figma',
          'Покрывать компоненты тестами',
        ],
        requirements: [
          'Уверенный JavaScript и основы TypeScript',
          'Опыт с React (учебные или pet-проекты)',
          'Понимание Git и REST API',
        ],
        conditions: [
          'Наставник и план развития',
          'Гибкий график и гибрид',
          'Оплачиваемая стажировка с перспективой оффера',
        ],
        city: 'Москва',
        workFormat: WorkFormat.HYBRID,
        employmentType: EmploymentType.INTERNSHIP,
        level: SeniorityLevel.JUNIOR,
        experienceYears: 1,
        salaryMin: 60000,
        salaryMax: 90000,
        skills: [
          { slug: 'react-typescript', required: true, weight: 1.5 },
          { slug: 'javascript', required: true, weight: 1.2 },
          { slug: 'react-hooks', required: true, weight: 1 },
          { slug: 'html-css', required: false, weight: 0.8 },
          { slug: 'rest-api', required: false, weight: 0.6 },
        ],
      },
      {
        title: 'Junior Backend-разработчик (Node.js + NestJS)',
        description:
          'Присоединяйтесь к backend-команде: REST API, PostgreSQL, очереди. Поможем разобраться в продакшене.',
        responsibilities: [
          'Разрабатывать REST API на NestJS',
          'Проектировать схемы данных в PostgreSQL',
          'Писать интеграционные тесты',
        ],
        requirements: [
          'Основы Node.js и TypeScript',
          'Понимание SQL и реляционных БД',
          'Базовое знание HTTP и REST',
        ],
        conditions: ['ДМС', 'Менторство', 'Современный стек'],
        city: 'Москва',
        workFormat: WorkFormat.REMOTE,
        employmentType: EmploymentType.FULL_TIME,
        level: SeniorityLevel.JUNIOR,
        experienceYears: 0.5,
        salaryMin: 80000,
        salaryMax: 120000,
        skills: [
          { slug: 'nodejs-nestjs', required: true, weight: 1.5 },
          { slug: 'postgresql', required: true, weight: 1.2 },
          { slug: 'rest-api', required: true, weight: 1 },
          { slug: 'redis', required: false, weight: 0.6 },
        ],
      },
    ],
  },
  {
    email: 'data@techintern.ru',
    name: 'Нейрон Лаб',
    description: 'R&D-лаборатория в области ML и анализа данных. Работаем с реальными датасетами.',
    city: 'Санкт-Петербург',
    industry: 'Data Science / ML',
    size: CompanySize.SMALL,
    plan: CompanyPlan.BASIC,
    vacancies: [
      {
        title: 'Стажёр Data Scientist (Python)',
        description:
          'Стажировка в ML-команде: подготовка данных, эксперименты, базовые модели. Идеально для студентов Math/Data.',
        responsibilities: [
          'Готовить и очищать данные на Pandas/NumPy',
          'Проводить EDA и базовые эксперименты',
          'Помогать с обучением и оценкой моделей',
        ],
        requirements: [
          'Python и Pandas/NumPy',
          'Основы статистики и ML',
          'SQL для выборок',
        ],
        conditions: ['Реальные данные', 'Публикации и конференции', 'Гибкий график'],
        city: 'Санкт-Петербург',
        workFormat: WorkFormat.OFFICE,
        employmentType: EmploymentType.INTERNSHIP,
        level: SeniorityLevel.INTERN,
        experienceYears: 0,
        salaryMin: 40000,
        salaryMax: 60000,
        skills: [
          { slug: 'python', required: true, weight: 1.5 },
          { slug: 'pandas-numpy', required: true, weight: 1.3 },
          { slug: 'machine-learning', required: true, weight: 1.1 },
          { slug: 'sql', required: false, weight: 0.8 },
        ],
      },
      {
        title: 'Стажёр Python / Django',
        description: 'Бэкенд на Django: API, админка, интеграции. Поможем выйти на первый коммерческий опыт.',
        responsibilities: ['Разрабатывать API на Django REST Framework', 'Поддерживать админку', 'Писать тесты'],
        requirements: ['Python', 'Основы Django', 'SQL'],
        conditions: ['Менторство', 'Гибрид', 'Оплачиваемая стажировка'],
        city: 'Санкт-Петербург',
        workFormat: WorkFormat.HYBRID,
        employmentType: EmploymentType.INTERNSHIP,
        level: SeniorityLevel.INTERN,
        experienceYears: 0,
        salaryMin: 45000,
        salaryMax: 70000,
        skills: [
          { slug: 'python-django', required: true, weight: 1.5 },
          { slug: 'python', required: true, weight: 1.2 },
          { slug: 'postgresql', required: false, weight: 0.8 },
          { slug: 'rest-api', required: false, weight: 0.7 },
        ],
      },
    ],
  },
  {
    email: 'studio@techintern.ru',
    name: 'Пиксель Студио',
    description: 'Веб-студия полного цикла. Делаем сайты и мобильные приложения для брендов.',
    city: 'Удалённо',
    industry: 'Web / Mobile агентство',
    size: CompanySize.STARTUP,
    plan: CompanyPlan.BASIC,
    vacancies: [
      {
        title: 'Frontend-стажёр (Vue.js)',
        description: 'Стажировка во Vue-команде: компонентная вёрстка, интеграция с API, анимации.',
        responsibilities: ['Верстать компоненты на Vue', 'Интегрировать REST API', 'Следить за адаптивностью'],
        requirements: ['JavaScript', 'Основы Vue.js', 'HTML/CSS'],
        conditions: ['Полная удалёнка', 'Гибкий график', 'Реальные клиентские проекты'],
        city: 'Удалённо',
        workFormat: WorkFormat.REMOTE,
        employmentType: EmploymentType.PART_TIME,
        level: SeniorityLevel.INTERN,
        experienceYears: 0,
        salaryMin: 30000,
        salaryMax: 50000,
        skills: [
          { slug: 'vuejs', required: true, weight: 1.5 },
          { slug: 'javascript', required: true, weight: 1.2 },
          { slug: 'html-css', required: true, weight: 1 },
        ],
      },
      {
        title: 'Стажёр React Native (мобильная разработка)',
        description: 'Разработка кроссплатформенных приложений на React Native. Наставник и код-ревью.',
        responsibilities: ['Разрабатывать экраны на React Native', 'Интегрировать API', 'Тестировать на iOS/Android'],
        requirements: ['JavaScript / React', 'Желание расти в мобильной разработке'],
        conditions: ['Удалёнка', 'Менторство', 'Гибкий график'],
        city: 'Удалённо',
        workFormat: WorkFormat.REMOTE,
        employmentType: EmploymentType.INTERNSHIP,
        level: SeniorityLevel.INTERN,
        experienceYears: 0,
        salaryMin: 40000,
        salaryMax: 65000,
        skills: [
          { slug: 'react-native', required: true, weight: 1.5 },
          { slug: 'javascript', required: true, weight: 1.2 },
          { slug: 'react-typescript', required: false, weight: 0.8 },
        ],
      },
      {
        title: 'Junior DevOps (Docker + CI/CD)',
        description: 'Поддержка инфраструктуры: контейнеризация, пайплайны, мониторинг.',
        responsibilities: ['Писать Dockerfile и compose', 'Настраивать CI/CD', 'Помогать с деплоем'],
        requirements: ['Linux', 'Docker', 'Основы CI/CD'],
        conditions: ['Удалёнка', 'Обучение за счёт компании'],
        city: 'Удалённо',
        workFormat: WorkFormat.REMOTE,
        employmentType: EmploymentType.INTERNSHIP,
        level: SeniorityLevel.JUNIOR,
        experienceYears: 0.5,
        salaryMin: 60000,
        salaryMax: 90000,
        skills: [
          { slug: 'docker', required: true, weight: 1.5 },
          { slug: 'ci-cd', required: true, weight: 1.2 },
          { slug: 'linux', required: true, weight: 1 },
          { slug: 'kubernetes', required: false, weight: 0.6 },
        ],
      },
    ],
  },
];

async function seedCompaniesAndVacancies(passwordHash: string): Promise<string[]> {
  const vacancyIds: string[] = [];

  for (const company of COMPANIES) {
    const user = await prisma.user.create({
      data: {
        email: company.email,
        passwordHash,
        role: Role.COMPANY,
        companyProfile: {
          create: {
            name: company.name,
            description: company.description,
            city: company.city,
            industry: company.industry,
            size: company.size,
            plan: company.plan,
          },
        },
      },
      include: { companyProfile: true },
    });

    const companyId = user.companyProfile!.id;

    for (const v of company.vacancies) {
      const created = await prisma.vacancy.create({
        data: {
          companyId,
          title: v.title,
          description: v.description,
          responsibilities: v.responsibilities,
          requirements: v.requirements,
          conditions: v.conditions,
          city: v.city,
          workFormat: v.workFormat,
          employmentType: v.employmentType,
          level: v.level,
          experienceYears: v.experienceYears,
          salaryMin: v.salaryMin,
          salaryMax: v.salaryMax,
          status: VacancyStatus.ACTIVE,
          skills: {
            create: v.skills.map((s) => ({
              skillId: skillId(s.slug),
              required: s.required ?? true,
              weight: s.weight ?? 1,
            })),
          },
        },
      });
      vacancyIds.push(created.id);
    }
  }

  return vacancyIds;
}

// --- Студенты ----------------------------------------------------------------

interface StudentSeed {
  email: string;
  fullName: string;
  headline: string;
  bio: string;
  city: string;
  university: string;
  course: number;
  specialization: SkillCategory;
  level: SeniorityLevel;
  experienceYears: number;
  githubUrl?: string;
  skills: { slug: string; progress: number }[];
  projects: { title: string; description: string; technologies: string[]; githubUrl?: string }[];
}

const STUDENTS: StudentSeed[] = [
  {
    email: 'student@techintern.ru',
    fullName: 'Алексей Смирнов',
    headline: 'Frontend-разработчик · React + TypeScript · ищу первую стажировку',
    bio: 'Студент 3 курса, увлечён фронтендом. Сделал несколько проектов на React и TypeScript, разбираюсь в хуках и управлении состоянием.',
    city: 'Москва',
    university: 'МГУ им. М. В. Ломоносова',
    course: 3,
    specialization: SkillCategory.FRONTEND,
    level: SeniorityLevel.JUNIOR,
    experienceYears: 1,
    githubUrl: 'https://github.com/example-alexey',
    // Прогресс совпадает с примером Skill Tree из доклада.
    skills: [
      { slug: 'javascript', progress: 100 },
      { slug: 'html-css', progress: 60 },
      { slug: 'react-typescript', progress: 40 },
      { slug: 'react-hooks', progress: 55 },
      { slug: 'state-management', progress: 35 },
      { slug: 'react-performance', progress: 20 },
      { slug: 'nextjs', progress: 10 },
      { slug: 'git', progress: 70 },
      { slug: 'rest-api', progress: 50 },
    ],
    projects: [
      {
        title: 'Трекер задач (Kanban)',
        description:
          'SPA на React + TypeScript с drag-and-drop, хранением в localStorage и тёмной темой.',
        technologies: ['React', 'TypeScript', 'Vite', 'Zustand'],
        githubUrl: 'https://github.com/example-alexey/kanban',
      },
      {
        title: 'Дашборд погоды',
        description: 'Приложение на React + TypeScript с запросами к открытому API и графиками.',
        technologies: ['React', 'TypeScript', 'REST API', 'Chart.js'],
      },
      {
        title: 'Лендинг для хакатона',
        description: 'Адаптивный лендинг с анимациями, собран в команде за выходные.',
        technologies: ['React', 'TypeScript', 'CSS', 'Framer Motion'],
      },
    ],
  },
  {
    email: 'maria@techintern.ru',
    fullName: 'Мария Иванова',
    headline: 'Data Science · Python · Pandas · ML-энтузиаст',
    bio: 'Изучаю анализ данных и ML, прохожу соревнования на Kaggle. Уверенно работаю с Pandas и SQL.',
    city: 'Санкт-Петербург',
    university: 'ВШЭ',
    course: 4,
    specialization: SkillCategory.DATA_SCIENCE,
    level: SeniorityLevel.JUNIOR,
    experienceYears: 0.5,
    skills: [
      { slug: 'python', progress: 85 },
      { slug: 'pandas-numpy', progress: 70 },
      { slug: 'machine-learning', progress: 45 },
      { slug: 'sql', progress: 60 },
    ],
    projects: [
      {
        title: 'Прогноз оттока клиентов',
        description: 'Модель классификации на табличных данных, EDA и подбор гиперпараметров.',
        technologies: ['Python', 'Pandas', 'scikit-learn'],
      },
    ],
  },
  {
    email: 'dmitry@techintern.ru',
    fullName: 'Дмитрий Кузнецов',
    headline: 'Backend · Node.js + NestJS · PostgreSQL',
    bio: 'Люблю проектировать API и работать с базами данных. Делал backend для нескольких pet-проектов.',
    city: 'Москва',
    university: 'МФТИ',
    course: 4,
    specialization: SkillCategory.BACKEND,
    level: SeniorityLevel.JUNIOR,
    experienceYears: 1,
    skills: [
      { slug: 'nodejs-nestjs', progress: 65 },
      { slug: 'postgresql', progress: 60 },
      { slug: 'rest-api', progress: 70 },
      { slug: 'redis', progress: 40 },
      { slug: 'docker', progress: 45 },
    ],
    projects: [
      {
        title: 'API маркетплейса',
        description: 'REST API на NestJS с авторизацией, PostgreSQL и Redis-кешем.',
        technologies: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis'],
      },
    ],
  },
  {
    email: 'sofia@techintern.ru',
    fullName: 'София Петрова',
    headline: 'Frontend-стажёр · Vue.js · вёрстка',
    bio: 'Начинаю путь во фронтенде, делаю учебные проекты на Vue. Внимательна к деталям вёрстки.',
    city: 'Удалённо',
    university: 'ИТМО',
    course: 2,
    specialization: SkillCategory.FRONTEND,
    level: SeniorityLevel.INTERN,
    experienceYears: 0,
    skills: [
      { slug: 'html-css', progress: 70 },
      { slug: 'javascript', progress: 55 },
      { slug: 'vuejs', progress: 50 },
    ],
    projects: [
      {
        title: 'Каталог рецептов',
        description: 'Учебное SPA на Vue с фильтрами и избранным.',
        technologies: ['Vue.js', 'JavaScript', 'CSS'],
      },
    ],
  },
];

async function seedStudents(passwordHash: string): Promise<string> {
  let primaryStudentId = '';

  for (const s of STUDENTS) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            fullName: s.fullName,
            headline: s.headline,
            bio: s.bio,
            city: s.city,
            university: s.university,
            course: s.course,
            specialization: s.specialization,
            level: s.level,
            experienceYears: s.experienceYears,
            githubUrl: s.githubUrl,
            openToWork: true,
            skills: {
              create: s.skills.map((sk) => ({ skillId: skillId(sk.slug), progress: sk.progress })),
            },
            projects: { create: s.projects },
          },
        },
      },
      include: { studentProfile: true },
    });

    if (s.email === 'student@techintern.ru') {
      primaryStudentId = user.studentProfile!.id;
    }
  }

  return primaryStudentId;
}

// --- Демо-отклики со статус-трекером -----------------------------------------

async function seedApplications(studentId: string, vacancyIds: string[]): Promise<void> {
  if (!studentId || vacancyIds.length < 3) return;

  // 1) Отклик на рассмотрении (высокий match — флагманский пример из доклада).
  await prisma.application.create({
    data: {
      studentId,
      vacancyId: vacancyIds[0]!, // Frontend React + TypeScript
      matchScore: 92,
      status: ApplicationStatus.PENDING,
      coverLetter:
        'Здравствуйте! Очень хочу присоединиться к вашей команде — у меня три проекта на React и TypeScript.',
      events: { create: { status: ApplicationStatus.PENDING, note: 'Отклик отправлен' } },
    },
  });

  // 2) Приглашение (есть прогресс по трекеру).
  await prisma.application.create({
    data: {
      studentId,
      vacancyId: vacancyIds[1]!,
      matchScore: 64,
      status: ApplicationStatus.INVITED,
      events: {
        create: [
          {
            status: ApplicationStatus.PENDING,
            note: 'Отклик отправлен',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          },
          { status: ApplicationStatus.INVITED, note: 'Вас пригласили на собеседование' },
        ],
      },
    },
  });
}

// --- Точка входа -------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🌱 Очистка базы…');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.applicationEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.guideProgress.deleteMany();
  await prisma.vacancySkill.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.careerResource.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log('🌲 Skill Tree…');
  for (const root of SKILL_ROOTS) {
    await seedSkillTree([root], root.category);
  }

  console.log('📚 Career Hub…');
  await seedCareerHub();

  console.log('🏢 Компании и вакансии…');
  const vacancyIds = await seedCompaniesAndVacancies(passwordHash);

  console.log('🎓 Студенты…');
  const primaryStudentId = await seedStudents(passwordHash);

  console.log('📨 Отклики…');
  await seedApplications(primaryStudentId, vacancyIds);

  console.log('✅ Сид завершён.');
  console.log('   Студент:  student@techintern.ru / password123');
  console.log('   Компания: company@techintern.ru / password123');
}

main()
  .catch((error) => {
    console.error('❌ Ошибка сидирования:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
