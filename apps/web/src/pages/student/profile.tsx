import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Github,
  GraduationCap,
  ListTree,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMyStudentProfile, useRecommendations, useRemoveProject, useSkillTree } from '@/hooks/use-students';
import { SkillTree } from '@/components/skill-tree/skill-tree';
import { ProfileEditDialog } from '@/components/student/profile-edit-dialog';
import { SkillsEditor } from '@/components/student/skills-editor';
import { ProjectFormDialog } from '@/components/student/project-form-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CATEGORY_LABELS, SENIORITY_LABELS } from '@/lib/constants';
import { initials } from '@/lib/utils';
import type { SkillTreeNode } from '@/types/api';

export function StudentProfilePage() {
  const { data: profile, isLoading } = useMyStudentProfile();
  const { data: skillTree } = useSkillTree();
  const [editProfile, setEditProfile] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [addProject, setAddProject] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillTreeNode | null>(null);

  if (isLoading || !profile) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Шапка профиля */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="size-20 rounded-2xl">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />}
              <AvatarFallback className="rounded-2xl text-xl">
                {initials(profile.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
                {profile.openToWork && <Badge variant="success">Открыт к предложениям</Badge>}
              </div>
              {profile.headline && (
                <p className="mt-1 text-muted-foreground">{profile.headline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <Badge variant="secondary">{SENIORITY_LABELS[profile.level]}</Badge>
                {profile.specialization && (
                  <Badge variant="muted">{CATEGORY_LABELS[profile.specialization]}</Badge>
                )}
                {profile.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {profile.city}
                  </span>
                )}
                {profile.university && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-3.5" />
                    {profile.university}
                    {profile.course ? `, ${profile.course} курс` : ''}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Github className="size-4" />
                    GitHub
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-4" />
                    Портфолио
                  </a>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={() => setEditProfile(true)}>
              <Pencil className="size-4" />
              Редактировать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Дерево навыков</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="about">О себе</TabsTrigger>
        </TabsList>

        {/* Skill Tree */}
        <TabsContent value="skills">
          {skillTree && skillTree.categories.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {skillTree.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{cat.label}</span>
                  <span className="font-semibold text-primary">{cat.progress}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListTree className="size-5 text-primary" />
                  Навыки
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditSkills(true)}>
                  <Pencil className="size-3.5" />
                  Редактировать
                </Button>
              </CardHeader>
              <CardContent>
                {skillTree ? (
                  <SkillTree
                    tree={skillTree.tree}
                    selectedSlug={selectedSkill?.slug}
                    onSelect={setSelectedSkill}
                  />
                ) : (
                  <Skeleton className="h-72" />
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Кликните по ветке, чтобы увидеть рекомендованные вакансии и материалы.
                </p>
              </CardContent>
            </Card>

            <RecommendationsPanel skill={selectedSkill} />
          </div>
        </TabsContent>

        {/* Проекты */}
        <TabsContent value="projects">
          <div className="mb-4 flex justify-end">
            <Button variant="gradient" onClick={() => setAddProject(true)}>
              <Plus className="size-4" />
              Добавить проект
            </Button>
          </div>
          {profile.projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {profile.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Пока нет проектов"
              description="Проекты — лучшее доказательство навыков. Добавьте хотя бы один."
            />
          )}
        </TabsContent>

        {/* О себе */}
        <TabsContent value="about">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="mb-1.5 font-semibold">О себе</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {profile.bio || 'Расскажите о себе в настройках профиля.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProfileEditDialog open={editProfile} onOpenChange={setEditProfile} profile={profile} />
      <SkillsEditor open={editSkills} onOpenChange={setEditSkills} currentSkills={profile.skills} />
      <ProjectFormDialog open={addProject} onOpenChange={setAddProject} />
    </div>
  );
}

function RecommendationsPanel({ skill }: { skill: SkillTreeNode | null }) {
  const { data } = useRecommendations(skill?.slug);

  return (
    <Card className="lg:sticky lg:top-24 lg:self-start">
      <CardHeader>
        <CardTitle className="text-base">
          {skill ? `Рекомендации: ${skill.name}` : 'Рекомендации'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Вакансии
          </p>
          {data && data.vacancies.length > 0 ? (
            <div className="space-y-2">
              {data.vacancies.slice(0, 4).map((vacancy) => (
                <Link
                  key={vacancy.id}
                  to={`/app/vacancies/${vacancy.id}`}
                  className="block rounded-lg border border-border p-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-accent/40"
                >
                  <p className="font-medium leading-tight">{vacancy.title}</p>
                  <p className="text-xs text-muted-foreground">{vacancy.company.name}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет подходящих вакансий.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Материалы
          </p>
          {data && data.resources.length > 0 ? (
            <div className="space-y-2">
              {data.resources.slice(0, 4).map((resource) => (
                <Link
                  key={resource.id}
                  to={`/app/career/${resource.slug}`}
                  className="block rounded-lg border border-border p-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-accent/40"
                >
                  {resource.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет материалов.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project }: { project: import('@/types/api').Project }) {
  const remove = useRemoveProject();
  const handleRemove = async () => {
    try {
      await remove.mutateAsync(project.id);
      toast.success('Проект удалён');
    } catch {
      toast.error('Не удалось удалить проект');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{project.title}</h3>
        <button
          onClick={handleRemove}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Удалить проект"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.technologies.map((tech) => (
          <span
            key={tech}
            className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-medium text-accent-foreground"
          >
            {tech}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-3 text-sm">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Github className="size-3.5" />
            Код
          </a>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Demo
          </a>
        )}
      </div>
    </Card>
  );
}
