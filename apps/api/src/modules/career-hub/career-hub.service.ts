import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ListResourcesDto } from './dto/list-resources.dto';

@Injectable()
export class CareerHubService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: ListResourcesDto) {
    const where: Prisma.CareerResourceWhereInput = {
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.category ? { category: { equals: dto.category, mode: 'insensitive' } } : {}),
      ...(dto.tag ? { tags: { has: dto.tag } } : {}),
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { summary: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.careerResource.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async getBySlug(slug: string) {
    const resource = await this.prisma.careerResource.findUnique({ where: { slug } });
    if (!resource) throw new NotFoundException('Материал не найден');
    return resource;
  }

  /** Студент отмечает материал как пройденный (питает Skill Tree). */
  async markCompleted(userId: string, resourceId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) throw new ForbiddenException('Профиль студента не найден');

    const resource = await this.prisma.careerResource.findUnique({ where: { id: resourceId } });
    if (!resource) throw new NotFoundException('Материал не найден');

    await this.prisma.guideProgress.upsert({
      where: { studentId_resourceId: { studentId: student.id, resourceId } },
      create: { studentId: student.id, resourceId, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });

    return { success: true };
  }

  async getProgress(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) throw new ForbiddenException('Профиль студента не найден');

    const [progress, total] = await Promise.all([
      this.prisma.guideProgress.findMany({
        where: { studentId: student.id, completed: true },
        select: { resourceId: true, completedAt: true },
      }),
      this.prisma.careerResource.count(),
    ]);

    return {
      completedIds: progress.map((p) => p.resourceId),
      completedCount: progress.length,
      totalCount: total,
    };
  }
}
