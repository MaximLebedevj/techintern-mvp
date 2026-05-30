import { useState } from 'react';
import { Code2, Lightbulb, MessageCircleQuestion, RotateCcw } from 'lucide-react';
import type { CareerResource } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CodeBlock } from '@/components/common/code-block';
import { Markdown } from '@/components/common/markdown';

/** Интерактивный разбор кода: плохо/хорошо, объяснение, вопросы интервьюера и тренажёр. */
export function CodeReview({ resource }: { resource: CareerResource }) {
  const [draft, setDraft] = useState(resource.goodCode ?? '');

  return (
    <div className="space-y-8">
      <Tabs defaultValue="good" className="w-full">
        <TabsList>
          <TabsTrigger value="bad">❌ Плохое решение</TabsTrigger>
          <TabsTrigger value="good">✅ Хорошее решение</TabsTrigger>
        </TabsList>
        <TabsContent value="bad">
          <CodeBlock code={resource.badCode ?? ''} language={resource.language} tone="bad" />
        </TabsContent>
        <TabsContent value="good">
          <CodeBlock code={resource.goodCode ?? ''} language={resource.language} tone="good" />
        </TabsContent>
      </Tabs>

      {resource.explanation && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Lightbulb className="size-5 text-warning" />
            Почему так лучше
          </h3>
          <Markdown content={resource.explanation} />
        </section>
      )}

      {resource.interviewerQuestions.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <MessageCircleQuestion className="size-5 text-primary" />
            Что может спросить интервьюер
          </h3>
          <ul className="space-y-2">
            {resource.interviewerQuestions.map((question, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Code2 className="size-5 text-primary" />
            Тренажёр: попробуйте сами
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraft(resource.goodCode ?? '')}
            className="text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Сбросить
          </Button>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="min-h-[200px] bg-[hsl(240_16%_8%)] font-mono text-sm text-[hsl(240_10%_92%)]"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Перепишите решение по памяти и сравните с эталоном — так знание закрепляется лучше.
        </p>
      </section>
    </div>
  );
}
