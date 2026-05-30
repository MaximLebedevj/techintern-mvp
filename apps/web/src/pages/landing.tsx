import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Filter,
  ListChecks,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { PublicNav } from '@/components/layout/public-nav';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { MatchRing } from '@/components/match/match-ring';

const STATS = [
  { value: '120 000', label: 'студентов IT/Math ищут работу ежегодно' },
  { value: '80%', label: 'вакансий требуют 1–3 года опыта' },
  { value: '2–3%', label: 'конверсия откликов в офферы на рынке' },
  { value: '×5', label: 'цель конверсии отклик → оффер в TechIntern' },
];

const FEATURES = [
  {
    icon: Filter,
    title: 'Глубокий поиск по технологиям',
    text: 'Фильтр по точному стеку: React + TypeScript, Python + Django — а не абстрактный «Frontend». Релевантность вакансий выше на 70%.',
  },
  {
    icon: Target,
    title: 'Только junior и стажировки',
    text: 'Никаких вакансий с требованием 3 лет опыта. Каждая позиция доступна новичку.',
  },
  {
    icon: BookOpen,
    title: 'Career Hub',
    text: 'Гайды, чеклисты и интерактивные разборы кода (React, Python) — встроенная подготовка к собеседованиям.',
  },
  {
    icon: Sparkles,
    title: 'AI-подбор',
    text: 'TF-IDF + косинусная близость: видите процент совпадения и что добавить, чтобы повысить шансы.',
  },
  {
    icon: ListChecks,
    title: 'Skill Tree',
    text: 'Интерактивное дерево навыков с прогрессом по направлениям и персональными рекомендациями.',
  },
  {
    icon: Send,
    title: 'Трекер откликов',
    text: 'Прозрачный статус каждого отклика: ⏳ На рассмотрении → ✅ Приглашение → 🎯 Оффер.',
  },
];

const FLOW = [
  { step: '01', title: 'Заполните профиль', text: 'Навыки, проекты, Skill Tree' },
  { step: '02', title: 'Найдите вакансию', text: 'Глубокий фильтр по стеку' },
  { step: '03', title: 'Откликнитесь', text: 'С AI-оценкой совпадения' },
  { step: '04', title: 'Следите за статусом', text: 'Прозрачный трекер' },
  { step: '05', title: 'Получите оффер', text: 'Первая работа в IT' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow-spot left-1/4 top-0 size-[500px] bg-brand-500/40" />
        <div className="glow-spot right-0 top-20 size-[420px] bg-fuchsia-500/30" />
        <div className="bg-grid absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="size-3.5 text-primary" />
              Специализированная платформа для IT-студентов
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Первая работа в IT — <span className="text-gradient">без барьеров</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              TechIntern — карьерный наставник для студентов IT. Глубокий поиск по технологиям,
              подготовка к собеседованиям и AI-подбор вакансий в одном месте.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gradient" size="lg">
                <Link to="/register">
                  Начать бесплатно
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">У меня есть аккаунт</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Бесплатно для студентов · Демо: student@techintern.ru / password123
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* Статистика */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl font-extrabold text-gradient sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Всё для старта карьеры
          </h2>
          <p className="mt-3 text-muted-foreground">
            Мы решаем ключевые боли студентов: информационный шум, завышенные требования и страх
            перед собеседованием.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Путь от профиля до оффера
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FLOW.map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-card p-5">
                <span className="font-display text-2xl font-extrabold text-primary/30">
                  {item.step}
                </span>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(245_55%_12%)] px-8 py-16 text-center text-white">
          <div className="glow-spot left-1/3 top-0 size-[360px] bg-brand-500" />
          <div className="glow-spot bottom-0 right-1/4 size-[360px] bg-fuchsia-500" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Готовы найти первую стажировку?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Присоединяйтесь к TechIntern — и сократите путь к первой работе с 3 до 1,5 месяцев.
            </p>
            <Button asChild size="lg" className="mt-8 bg-white text-[hsl(245_55%_18%)] hover:bg-white/90">
              <Link to="/register">
                Создать аккаунт
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TechIntern — стажировки для IT-студентов
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Декоративный «превью» продукта в hero. */
function HeroPreview() {
  const skills = [
    { name: 'JavaScript', value: 100 },
    { name: 'React + TypeScript', value: 72 },
    { name: 'HTML / CSS', value: 60 },
    { name: 'Next.js', value: 28 },
  ];
  return (
    <div className="relative">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card-hover">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Frontend-разработчик</p>
            <p className="font-semibold">React + TypeScript</p>
          </div>
          <MatchRing score={92} size={72} strokeWidth={6} />
        </div>
        <div className="mt-5 space-y-3">
          {skills.map((skill) => (
            <div key={skill.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{skill.name}</span>
                <span className="text-muted-foreground">{skill.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${skill.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-card-hover sm:block">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="size-4 text-success" />
          Добавьте Redux <span className="text-success">+15%</span>
        </div>
      </div>
    </div>
  );
}
