import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/common/logo';

const HIGHLIGHTS = [
  'Глубокий поиск по технологиям — React + TypeScript, а не просто «Frontend»',
  'Только junior- и стажёрские вакансии — без требования 1–3 лет опыта',
  'Career Hub: гайды, чеклисты и разборы кода для подготовки',
  'AI-подбор: видите процент совпадения с каждой вакансией',
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Брендовая панель */}
      <div className="relative hidden overflow-hidden bg-[hsl(245_55%_12%)] p-12 text-white lg:flex lg:flex-col">
        <div className="glow-spot left-[-10%] top-[-10%] size-[420px] bg-brand-500" />
        <div className="glow-spot bottom-[-15%] right-[-10%] size-[460px] bg-fuchsia-500" />

        <Link to="/" className="relative z-10">
          <Logo className="[&_span]:text-white" />
        </Link>

        <div className="relative z-10 mt-auto">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            Карьерный старт в IT
            <br />
            начинается здесь
          </h2>
          <p className="mt-3 max-w-md text-white/70">
            SkillProof — это не просто job-board, а карьерный наставник для студентов IT.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Форма */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
