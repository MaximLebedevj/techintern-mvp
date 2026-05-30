import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { SkillTreeNode } from '@/types/api';
import { cn } from '@/lib/utils';

interface SkillTreeProps {
  tree: SkillTreeNode[];
  selectedSlug?: string;
  onSelect?: (node: SkillTreeNode) => void;
}

function progressTone(progress: number): string {
  if (progress >= 80) return 'bg-success';
  if (progress >= 50) return 'bg-primary';
  if (progress >= 25) return 'bg-warning';
  return 'bg-muted-foreground/40';
}

function collectExpanded(nodes: SkillTreeNode[], depth: number, acc: Set<string>): void {
  // По умолчанию раскрываем первые два уровня.
  for (const node of nodes) {
    if (depth < 1 && node.children.length) acc.add(node.id);
    collectExpanded(node.children, depth + 1, acc);
  }
}

export function SkillTree({ tree, selectedSlug, onSelect }: SkillTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const acc = new Set<string>();
    collectExpanded(tree, 0, acc);
    return acc;
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          toggle={toggle}
          selectedSlug={selectedSlug}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface TreeRowProps {
  node: SkillTreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedSlug?: string;
  onSelect?: (node: SkillTreeNode) => void;
}

function TreeRow({ node, depth, expanded, toggle, selectedSlug, onSelect }: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedSlug === node.slug;
  const isRoot = depth === 0;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-xl px-2 py-2 transition-colors',
          isSelected ? 'bg-accent' : 'hover:bg-muted/60',
        )}
        style={{ paddingLeft: depth * 18 + 8 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
          >
            <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="grid size-5 shrink-0 place-items-center">
            <span className="size-1.5 rounded-full bg-border" />
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelect?.(node)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              'shrink-0 truncate text-sm',
              isRoot ? 'font-semibold' : 'font-medium',
              isSelected && 'text-accent-foreground',
            )}
          >
            {node.name}
          </span>

          <span className="ml-auto flex w-32 shrink-0 items-center gap-2 sm:w-44">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className={cn('block h-full rounded-full', progressTone(node.progress))}
                initial={{ width: 0 }}
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
              {node.progress}%
            </span>
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                selectedSlug={selectedSlug}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
