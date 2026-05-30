import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetSkills, useSkillCatalog } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORY_LABELS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/api';
import type { Skill, SkillCategory, StudentSkill } from '@/types/api';

interface SkillsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSkills: StudentSkill[];
}

/** Редактор Skill Tree: задаёт прогресс владения (0–100%) по каждому навыку. */
export function SkillsEditor({ open, onOpenChange, currentSkills }: SkillsEditorProps) {
  const { data: catalog } = useSkillCatalog();
  const setSkills = useSetSkills();
  const [progress, setProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries(currentSkills.map((s) => [s.skill.id, s.progress])),
  );

  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    for (const skill of catalog ?? []) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return map;
  }, [catalog]);

  const save = async () => {
    const payload = Object.entries(progress)
      .filter(([, value]) => value > 0)
      .map(([skillId, value]) => ({ skillId, progress: value }));
    try {
      await setSkills.mutateAsync(payload);
      toast.success('Навыки обновлены');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось сохранить навыки'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование навыков</DialogTitle>
          <DialogDescription>
            Отметьте уровень владения — дерево навыков и AI-подбор обновятся автоматически.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[55vh] pr-3">
          <div className="space-y-6">
            {[...grouped.entries()].map(([category, skills]) => (
              <div key={category}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABELS[category]}
                </p>
                <div className="space-y-4">
                  {skills.map((skill) => {
                    const value = progress[skill.id] ?? 0;
                    return (
                      <div key={skill.id}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="w-10 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                            {value}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={value}
                          onChange={(e) =>
                            setProgress((prev) => ({ ...prev, [skill.id]: Number(e.target.value) }))
                          }
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="gradient" onClick={save} disabled={setSkills.isPending}>
            {setSkills.isPending && <Loader2 className="size-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
