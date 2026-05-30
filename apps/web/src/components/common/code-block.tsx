import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string | null;
  tone?: 'bad' | 'good' | 'neutral';
  className?: string;
}

const toneStyles: Record<NonNullable<CodeBlockProps['tone']>, string> = {
  bad: 'border-destructive/30',
  good: 'border-success/30',
  neutral: 'border-border',
};

export function CodeBlock({ code, language, tone = 'neutral', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard недоступен */
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-[hsl(240_16%_8%)] text-[hsl(240_10%_92%)]',
        toneStyles[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-white/50">{language ?? 'code'}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
