import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Лёгкий рендерер Markdown для контролируемого контента Career Hub.
 * Поддерживает: ## / ### заголовки, списки (- и 1.), цитаты (>),
 * **жирный**, `код`, абзацы. Без dangerouslySetInnerHTML — безопасно.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Разбиваем по **жирный** и `код`, сохраняя разделители.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items.map((item, i) => (
      <li key={`${key}-${i}`} className="leading-relaxed">
        {renderInline(item, `${key}-${i}`)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key} className="ml-5 list-decimal space-y-1.5 text-muted-foreground">
          {items}
        </ol>
      ) : (
        <ul key={key} className="ml-5 list-disc space-y-1.5 text-muted-foreground marker:text-primary">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const key = `block-${index}`;

    if (!line.trim()) {
      flushList(key);
      return;
    }

    const ordered = /^\d+\.\s/.test(line);
    const unordered = /^[-*]\s/.test(line);
    if (ordered || unordered) {
      const text = line.replace(/^(\d+\.\s|[-*]\s)/, '');
      if (!list || list.ordered !== ordered) {
        flushList(key);
        list = { ordered, items: [] };
      }
      list.items.push(text);
      return;
    }
    flushList(key);

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={key} className="mt-5 text-base font-semibold text-foreground">
          {renderInline(line.slice(4), key)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={key} className="mt-6 text-xl font-bold tracking-tight text-foreground">
          {renderInline(line.slice(3), key)}
        </h2>,
      );
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={key}
          className="border-l-2 border-primary/50 bg-accent/40 py-2 pl-4 pr-3 text-sm italic text-foreground"
        >
          {renderInline(line.slice(2), key)}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={key} className="leading-relaxed text-muted-foreground">
          {renderInline(line, key)}
        </p>,
      );
    }
  });
  flushList('block-final');

  return <div className={cn('space-y-3 text-sm', className)}>{blocks}</div>;
}
