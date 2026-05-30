import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { computeMatch } from './skill-matcher';
import { computeIdf, tokenize } from './tfidf';
import type { MatchResult, StudentVector, VacancyVector } from './matching.types';

// Полные формы сущностей, нужные для матчинга.
type StudentForMatch = Prisma.StudentProfileGetPayload<{
  include: { skills: { include: { skill: true } }; projects: true };
}>;
type VacancyForMatch = Prisma.VacancyGetPayload<{
  include: { skills: { include: { skill: true } } };
}>;

const IDF_CACHE_KEY = 'matching:skill-idf';
const IDF_TTL_SECONDS = 600; // 10 минут
const RESULT_TTL_SECONDS = 300; // 5 минут

/**
 * Прикладной сервис матчинга: загружает данные, строит векторы,
 * кеширует IDF-корпус и результаты (см. CLAUDE.md §4).
 */
@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Удобный include для загрузки студента под матчинг. */
  static studentInclude = {
    skills: { include: { skill: true } },
    projects: true,
  } satisfies Prisma.StudentProfileInclude;

  static vacancyInclude = {
    skills: { include: { skill: true } },
  } satisfies Prisma.VacancyInclude;

  toStudentVector(student: StudentForMatch): StudentVector {
    const projectTechnologies = student.projects.flatMap((p) => p.technologies);
    const text = [
      student.headline,
      student.bio,
      student.university,
      student.specialization,
      ...student.projects.map((p) => `${p.title} ${p.description}`),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      skills: student.skills.map((s) => ({
        slug: s.skill.slug,
        name: s.skill.name,
        progress: s.progress,
      })),
      projectTechnologies,
      level: student.level,
      experienceYears: student.experienceYears,
      text,
    };
  }

  toVacancyVector(vacancy: VacancyForMatch): VacancyVector {
    const text = [vacancy.title, vacancy.description, ...vacancy.requirements]
      .filter(Boolean)
      .join(' ');
    return {
      skills: vacancy.skills.map((s) => ({
        slug: s.skill.slug,
        name: s.skill.name,
        required: s.required,
        weight: s.weight,
      })),
      level: vacancy.level,
      experienceYears: vacancy.experienceYears,
      text,
    };
  }

  /**
   * IDF навыков по корпусу активных вакансий (редкие навыки дискриминативнее).
   * Кешируется в Redis; при пустом корпусе IDF=1 для всех (нейтрально).
   */
  async getSkillIdf(): Promise<Map<string, number>> {
    const cached = await this.redis.get(IDF_CACHE_KEY);
    if (cached) {
      try {
        return new Map(JSON.parse(cached) as [string, number][]);
      } catch {
        /* пересчитаем ниже */
      }
    }

    const vacancies = await this.prisma.vacancy.findMany({
      where: { status: 'ACTIVE' },
      include: { skills: { include: { skill: true } } },
    });

    const documents = vacancies.map((v) =>
      v.skills.flatMap((s) => tokenize(s.skill.name)),
    );
    const idf = computeIdf(documents);
    await this.redis.set(IDF_CACHE_KEY, JSON.stringify([...idf.entries()]), IDF_TTL_SECONDS);
    return idf;
  }

  /** Прямой расчёт по уже загруженным сущностям (без обращения к БД). */
  computeFromEntities(
    student: StudentForMatch,
    vacancy: VacancyForMatch,
    idf: Map<string, number>,
  ): MatchResult {
    return computeMatch(this.toStudentVector(student), this.toVacancyVector(vacancy), idf);
  }

  /** Матч студент↔вакансия с кешированием результата. */
  async match(studentId: string, vacancyId: string): Promise<MatchResult> {
    const cacheKey = `matching:result:${vacancyId}:${studentId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as MatchResult;
      } catch {
        /* пересчёт */
      }
    }

    const [student, vacancy, idf] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: MatchingService.studentInclude,
      }),
      this.prisma.vacancy.findUnique({
        where: { id: vacancyId },
        include: MatchingService.vacancyInclude,
      }),
      this.getSkillIdf(),
    ]);

    if (!student || !vacancy) {
      return {
        score: 0,
        breakdown: { skills: 0, text: 0, level: 0 },
        matchedSkills: [],
        missingSkills: [],
        explanation: ['Недостаточно данных для расчёта совпадения.'],
      };
    }

    const result = this.computeFromEntities(student, vacancy, idf);
    await this.redis.set(cacheKey, JSON.stringify(result), RESULT_TTL_SECONDS);
    return result;
  }

  /** Ранжирование кандидатов под вакансию (для компании). */
  async rankCandidates(
    vacancyId: string,
    limit = 50,
  ): Promise<Array<{ student: StudentForMatch; match: MatchResult }>> {
    const [vacancy, students, idf] = await Promise.all([
      this.prisma.vacancy.findUnique({
        where: { id: vacancyId },
        include: MatchingService.vacancyInclude,
      }),
      this.prisma.studentProfile.findMany({
        where: { openToWork: true },
        include: MatchingService.studentInclude,
        take: 200,
      }),
      this.getSkillIdf(),
    ]);

    if (!vacancy) return [];

    return students
      .map((student) => ({ student, match: this.computeFromEntities(student, vacancy, idf) }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, limit);
  }

  /** Сбрасывает кеш матчинга, затронутый изменением студента/вакансии. */
  async invalidateForStudent(studentId: string): Promise<void> {
    await this.redis.delByPattern(`matching:result:*:${studentId}`);
  }

  async invalidateForVacancy(vacancyId: string): Promise<void> {
    await this.redis.delByPattern(`matching:result:${vacancyId}:*`);
    await this.redis.del(IDF_CACHE_KEY);
  }
}
