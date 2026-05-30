import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, VacancyStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../../common/types/auth.types';
import { MatchingService } from '../matching/matching.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { SearchVacanciesDto } from './dto/search-vacancies.dto';

@Injectable()
export class VacanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
  ) {}

  private readonly cardInclude = {
    company: { select: { id: true, name: true, logoUrl: true, city: true } },
    skills: { include: { skill: true } },
    _count: { select: { applications: true } },
  } satisfies Prisma.VacancyInclude;

  private readonly detailInclude = {
    company: true,
    skills: { include: { skill: true } },
    _count: { select: { applications: true } },
  } satisfies Prisma.VacancyInclude;

  // --- Поиск ------------------------------------------------------------------

  async search(dto: SearchVacanciesDto) {
    const where: Prisma.VacancyWhereInput = {
      status: VacancyStatus.ACTIVE,
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { description: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(dto.city ? { city: { equals: dto.city, mode: 'insensitive' } } : {}),
      ...(dto.workFormat ? { workFormat: dto.workFormat } : {}),
      ...(dto.employmentType ? { employmentType: dto.employmentType } : {}),
      ...(dto.level ? { level: dto.level } : {}),
      ...(dto.salaryMin ? { salaryMax: { gte: dto.salaryMin } } : {}),
      // Глубокий фильтр: вакансия должна содержать ВСЕ выбранные навыки.
      ...(dto.skills && dto.skills.length > 0
        ? { AND: dto.skills.map((slug) => ({ skills: { some: { skill: { slug } } } })) }
        : {}),
    };

    const orderBy: Prisma.VacancyOrderByWithRelationInput =
      dto.sort === 'salary' ? { salaryMax: 'desc' } : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vacancy.findMany({
        where,
        include: this.cardInclude,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.vacancy.count({ where }),
    ]);

    return paginate(items, total, dto.page, dto.limit);
  }

  // --- Деталь -----------------------------------------------------------------

  async getById(id: string, viewer?: AuthenticatedUser) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id },
      include: this.detailInclude,
    });
    if (!vacancy) throw new NotFoundException('Вакансия не найдена');

    // Для студента добавляем персональный match-score и флаг отклика.
    if (viewer?.role === Role.STUDENT) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId: viewer.id },
        select: { id: true },
      });
      if (student) {
        const [match, application] = await Promise.all([
          this.matching.match(student.id, id),
          this.prisma.application.findUnique({
            where: { studentId_vacancyId: { studentId: student.id, vacancyId: id } },
            select: { id: true, status: true },
          }),
        ]);
        return { ...vacancy, match, application };
      }
    }

    return vacancy;
  }

  // --- Управление вакансиями (компания) ---------------------------------------

  async requireCompanyId(userId: string): Promise<string> {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!company) throw new ForbiddenException('Профиль компании не найден');
    return company.id;
  }

  private async requireOwnedVacancy(userId: string, vacancyId: string) {
    const companyId = await this.requireCompanyId(userId);
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Вакансия не найдена');
    if (vacancy.companyId !== companyId) {
      throw new ForbiddenException('Это не ваша вакансия');
    }
    return vacancy;
  }

  async create(userId: string, dto: CreateVacancyDto) {
    const companyId = await this.requireCompanyId(userId);
    const { skills, ...rest } = dto;

    const vacancy = await this.prisma.vacancy.create({
      data: {
        companyId,
        ...rest,
        responsibilities: rest.responsibilities ?? [],
        requirements: rest.requirements ?? [],
        conditions: rest.conditions ?? [],
        skills: {
          create: skills.map((s) => ({
            skillId: s.skillId,
            required: s.required ?? true,
            weight: s.weight ?? 1,
          })),
        },
      },
      include: this.detailInclude,
    });

    await this.matching.invalidateForVacancy(vacancy.id); // меняется IDF-корпус
    return vacancy;
  }

  async update(userId: string, id: string, dto: UpdateVacancyDto) {
    await this.requireOwnedVacancy(userId, id);
    const { skills, ...rest } = dto;

    await this.prisma.$transaction(async (tx) => {
      await tx.vacancy.update({ where: { id }, data: rest });
      if (skills) {
        await tx.vacancySkill.deleteMany({ where: { vacancyId: id } });
        await tx.vacancySkill.createMany({
          data: skills.map((s) => ({
            vacancyId: id,
            skillId: s.skillId,
            required: s.required ?? true,
            weight: s.weight ?? 1,
          })),
          skipDuplicates: true,
        });
      }
    });

    await this.matching.invalidateForVacancy(id);
    return this.prisma.vacancy.findUnique({ where: { id }, include: this.detailInclude });
  }

  async remove(userId: string, id: string) {
    await this.requireOwnedVacancy(userId, id);
    await this.prisma.vacancy.delete({ where: { id } });
    await this.matching.invalidateForVacancy(id);
    return { success: true };
  }

  // --- Отклики на вакансию (для компании) -------------------------------------

  async getApplicants(userId: string, vacancyId: string) {
    await this.requireOwnedVacancy(userId, vacancyId);

    return this.prisma.application.findMany({
      where: { vacancyId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            headline: true,
            city: true,
            university: true,
            level: true,
            specialization: true,
            skills: { include: { skill: true }, orderBy: { progress: 'desc' }, take: 6 },
            _count: { select: { projects: true } },
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
