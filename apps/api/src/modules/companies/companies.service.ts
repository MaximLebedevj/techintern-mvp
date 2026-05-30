import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async requireCompanyId(userId: string): Promise<string> {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!company) throw new ForbiddenException('Профиль компании не найден');
    return company.id;
  }

  async getMyProfile(userId: string) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      include: { _count: { select: { vacancies: true } } },
    });
    if (!company) throw new NotFoundException('Профиль компании не найден');
    return company;
  }

  async updateProfile(userId: string, dto: UpdateCompanyProfileDto) {
    const id = await this.requireCompanyId(userId);
    return this.prisma.companyProfile.update({ where: { id }, data: dto });
  }

  async getMyVacancies(userId: string) {
    const companyId = await this.requireCompanyId(userId);
    return this.prisma.vacancy.findMany({
      where: { companyId },
      include: {
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Метрики для дашборда компании (см. доклад §4.1 «Аналитика»). */
  async getStats(userId: string) {
    const companyId = await this.requireCompanyId(userId);

    const [totalVacancies, activeVacancies, applications] = await Promise.all([
      this.prisma.vacancy.count({ where: { companyId } }),
      this.prisma.vacancy.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.application.findMany({
        where: { vacancy: { companyId } },
        select: { status: true, matchScore: true },
      }),
    ]);

    const byStatus: Record<ApplicationStatus, number> = {
      PENDING: 0,
      INVITED: 0,
      OFFER: 0,
      REJECTED: 0,
    };
    let matchSum = 0;
    for (const app of applications) {
      byStatus[app.status] += 1;
      matchSum += app.matchScore;
    }

    const total = applications.length;
    // Конверсия отклик → оффер (ключевая метрика из доклада).
    const conversion = total > 0 ? Math.round((byStatus.OFFER / total) * 1000) / 10 : 0;

    return {
      totalVacancies,
      activeVacancies,
      totalApplications: total,
      byStatus,
      avgMatch: total > 0 ? Math.round(matchSum / total) : 0,
      conversionToOffer: conversion,
    };
  }

  async getPublicProfile(id: string) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { id },
      include: {
        vacancies: {
          where: { status: 'ACTIVE' },
          include: {
            skills: { include: { skill: true } },
            _count: { select: { applications: true } },
            company: { select: { id: true, name: true, logoUrl: true, city: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }
}
