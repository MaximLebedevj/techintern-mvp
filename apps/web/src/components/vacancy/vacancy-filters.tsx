import { useMemo } from 'react';
import { Check, Plus, RotateCcw, X } from 'lucide-react';
import type { VacancyFilters as Filters } from '@/hooks/use-vacancies';
import { useSkillCatalog } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORY_LABELS,
  EMPLOYMENT_OPTIONS,
  SENIORITY_OPTIONS,
  WORK_FORMAT_OPTIONS,
} from '@/lib/constants';
import type { Skill, SkillCategory } from '@/types/api';
import { cn } from '@/lib/utils';

interface VacancyFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

const ALL = 'ALL';

export function VacancyFilters({ filters, onChange, onReset }: VacancyFiltersProps) {
  const { data: skills } = useSkillCatalog();
  const selected = filters.skills ?? [];

  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    for (const skill of skills ?? []) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return map;
  }, [skills]);

  const selectedSkills = (skills ?? []).filter((s) => selected.includes(s.slug));

  const toggleSkill = (slug: string) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChange({ skills: next, page: 1 });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Фильтры</h3>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <RotateCcw className="size-3.5" />
          Сбросить
        </Button>
      </div>

      {/* Глубокий фильтр по технологиям — ключевая фича из доклада. */}
      <div className="space-y-2">
        <Label>Технологии (точный стек)</Label>
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedSkills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.slug)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {skill.name}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-muted-foreground">
              <Plus className="size-4" />
              Добавить технологию
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <ScrollArea className="h-72">
              <div className="p-2">
                {[...grouped.entries()].map(([category, list]) => (
                  <div key={category} className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </p>
                    {list.map((skill) => {
                      const active = selected.includes(skill.slug);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.slug)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                            active && 'text-primary',
                          )}
                        >
                          {skill.name}
                          {active && <Check className="size-4" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <FilterSelect
        label="Формат работы"
        value={filters.workFormat}
        options={WORK_FORMAT_OPTIONS}
        onChange={(v) => onChange({ workFormat: v, page: 1 })}
      />
      <FilterSelect
        label="Тип занятости"
        value={filters.employmentType}
        options={EMPLOYMENT_OPTIONS}
        onChange={(v) => onChange({ employmentType: v, page: 1 })}
      />
      <FilterSelect
        label="Уровень"
        value={filters.level}
        options={SENIORITY_OPTIONS}
        onChange={(v) => onChange({ level: v, page: 1 })}
      />

      <div className="space-y-2">
        <Label htmlFor="city-filter">Город</Label>
        <Input
          id="city-filter"
          placeholder="Любой город"
          value={filters.city ?? ''}
          onChange={(e) => onChange({ city: e.target.value || undefined, page: 1 })}
        />
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Любой</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
