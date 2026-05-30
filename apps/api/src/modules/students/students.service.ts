import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SkillCategory } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { MatchingService } from '../matching/matching.service';
import { SkillsService, SkillNode } from '../skills/skills.service';
import { tokenize } from '../matching/tfidf';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListCandidatesDto } from './dto/list-candidates.dto';

/** Узел Skill Tree с прогрессом студента (0–100). */
export interface SkillTreeNode extends SkillNode {
  progress: number;
  children: SkillTreeNode[];
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATA_SCIENCE: 'Data Science',
  DEVOPS: 'DevOps',
  MOBILE: 'Mobile',
  FUNDAMENTALS: 'Основы',
};

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly matching: MatchingService,
  ) {}

  private readonly fullInclude = {
    skills: { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
    projects: { orderBy: { createdAt: 'desc' } },
    _count: { select: { applications: true } },
  } satisfies Prisma.StudentProfileInclude;

  /** id профиля студента по userId (или 403, если профиль отсутствует). */
  async requireProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new ForbiddenException('Профиль студента не найден');
    return profile.id;
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: this.fullInclude,
    });
    if (!profile) throw new NotFoundException('Профиль студента не найден');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateStudentProfileDto) {
    const id = await this.requireProfileId(userId);
    const profile = await this.prisma.studentProfile.update({
      where: { id },
      data: dto,
      include: this.fullInclude,
    });
    await this.matching.invalidateForStudent(id);
    return profile;
  }

  /** Полная замена набора навыков студента (для Skill Tree). */
  async setSkills(userId: string, dto: UpdateSkillsDto) {
    const studentId = await this.requireProfileId(userId);

    await this.prisma.$transaction([
      this.prisma.studentSkill.deleteMany({ where: { studentId } }),
      this.prisma.studentSkill.createMany({
        data: dto.skills.map((s) => ({
          studentId,
          skillId: s.skillId,
          progress: s.progress,
        })),
        skipDuplicates: true,
      }),
    ]);

    await this.matching.invalidateForStudent(studentId);
    return this.getSkillTree(userId);
  }

  async addProject(userId: string, dto: CreateProjectDto) {
    const studentId = await this.requireProfileId(userId);
    const project = await this.prisma.project.create({
      data: { studentId, ...dto },
    });
    await this.matching.invalidateForStudent(studentId);
    return project;
  }

  async removeProject(userId: string, projectId: string) {
    const studentId = await this.requireProfileId(userId);
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.studentId !== studentId) {
      throw new NotFoundException('Проект не найден');
    }
    await this.prisma.project.delete({ where: { id: projectId } });
    await this.matching.invalidateForStudent(studentId);
    return { success: true };
  }

  /**
   * Интерактивное Skill Tree: каталог навыков, аннотированный прогрессом студента.
   * Прогресс узла = собственный (если есть запись) либо среднее по детям.
   */
  async getSkillTree(userId: string): Promise<{
    tree: SkillTreeNode[];
    categories: { category: SkillCategory; label: string; progress: number }[];
  }> {
    const studentId = await this.requireProfileId(userId);

    const [catalog, studentSkills] = await Promise.all([
      this.skills.listFlat(),
      this.prisma.studentSkill.findMany({
        where: { studentId },
        include: { skill: { select: { category: true } } },
      }),
    ]);

    const progressBySkillId = new Map(studentSkills.map((s) => [s.skillId, s.progress]));
    const baseTree = this.skills.buildTree(catalog);

    const annotate = (node: SkillNode): SkillTreeNode => {
      const children = node.children.map(annotate);
      const own = progressBySkillId.get(node.id);
      let progress: number;
      if (own !== undefined) {
        progress = own;
      } else if (children.length > 0) {
        progress = Math.round(
          children.reduce((sum, c) => sum + c.progress, 0) / children.length,
        );
      } else {
        progress = 0;
      }
      return { ...node, progress, children };
    };

    const tree = baseTree.map(annotate);

    // Сводка по направлениям — среднее по освоенным навыкам категории.
    const agg = new Map<SkillCategory, { sum: number; count: number }>();
    for (const s of studentSkills) {
      const entry = agg.get(s.skill.category) ?? { sum: 0, count: 0 };
      entry.sum += s.progress;
      entry.count += 1;
      agg.set(s.skill.category, entry);
    }
    const categories = (Object.keys(CATEGORY_LABELS) as SkillCategory[])
      .map((category) => {
        const entry = agg.get(category);
        return {
          category,
          label: CATEGORY_LABELS[category],
          progress: entry ? Math.round(entry.sum / entry.count) : 0,
        };
      })
      .filter((c) => c.progress > 0 || tree.some((node) => node.category === c.category));

    return { tree, categories };
  }

  /** Рекомендации по клику на ветку дерева: вакансии + материалы по навыку. */
  async getRecommendations(userId: string, skillSlug?: string) {
    await this.requireProfileId(userId);

    if (skillSlug) {
      const skill = await this.prisma.skill.findUnique({ where: { slug: skillSlug } });
      const tokens = skill ? [skill.name, ...tokenize(skill.name)] : [];

      const [vacancies, resources] = await Promise.all([
        this.prisma.vacancy.findMany({
          where: { status: 'ACTIVE', skills: { some: { skill: { slug: skillSlug } } } },
          include: this.vacancyCardInclude,
          take: 6,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.careerResource.findMany({
          where: tokens.length ? { tags: { hasSome: tokens } } : undefined,
          take: 4,
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

      return { skill, vacancies, resources };
    }

    // Без выбранного навыка — общие рекомендации.
    const [vacancies, resources] = await Promise.all([
      this.prisma.vacancy.findMany({
        where: { status: 'ACTIVE' },
        include: this.vacancyCardInclude,
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.careerResource.findMany({
        where: { featured: true },
        take: 4,
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return { skill: null, vacancies, resources };
  }

  // --- Просмотр кандидатов компанией ------------------------------------------

  async getPublicProfile(id: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true }, orderBy: { progress: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!profile) throw new NotFoundException('Кандидат не найден');
    return profile;
  }

  async listCandidates(dto: ListCandidatesDto): Promise<PaginatedResult<unknown>> {
    // Режим ранжирования под конкретную вакансию (match-score).
    if (dto.vacancyId) {
      const ranked = await this.matching.rankCandidates(dto.vacancyId, 200);
      const filtered = ranked.filter(({ student }) => {
        if (dto.specialization && student.specialization !== dto.specialization) return false;
        if (dto.q) {
          const haystack = `${student.fullName} ${student.headline ?? ''}`.toLowerCase();
          if (!haystack.includes(dto.q.toLowerCase())) return false;
        }
        return true;
      });

      const items = filtered.slice(dto.skip, dto.skip + dto.limit).map(({ student, match }) => ({
        ...this.toCandidateCard(student),
        match: {
          score: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        },
      }));
      return paginate(items, filtered.length, dto.page, dto.limit);
    }

    // Обычный просмотр базы кандидатов.
    const where: Prisma.StudentProfileWhereInput = {
      openToWork: true,
      ...(dto.specialization ? { specialization: dto.specialization } : {}),
      ...(dto.q
        ? {
            OR: [
              { fullName: { contains: dto.q, mode: 'insensitive' } },
              { headline: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.studentProfile.findMany({
        where,
        include: {
          skills: { include: { skill: true }, orderBy: { progress: 'desc' }, take: 6 },
          _count: { select: { projects: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return paginate(profiles.map((p) => this.toCandidateCard(p)), total, dto.page, dto.limit);
  }

  // --- Мапперы ----------------------------------------------------------------

  private readonly vacancyCardInclude = {
    company: { select: { id: true, name: true, logoUrl: true, city: true } },
    skills: { include: { skill: true } },
    _count: { select: { applications: true } },
  } satisfies Prisma.VacancyInclude;

  private toCandidateCard(student: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    headline: string | null;
    city: string | null;
    university: string | null;
    level: string;
    specialization: SkillCategory | null;
    isPremium: boolean;
    skills?: { progress: number; skill: { name: string } }[];
    _count?: { projects?: number };
  }) {
    return {
      id: student.id,
      fullName: student.fullName,
      avatarUrl: student.avatarUrl,
      headline: student.headline,
      city: student.city,
      university: student.university,
      level: student.level,
      specialization: student.specialization,
      isPremium: student.isPremium,
      topSkills:
        student.skills?.slice(0, 6).map((s) => ({ name: s.skill.name, progress: s.progress })) ??
        [],
      projectCount: student._count?.projects ?? 0,
    };
  }
}
