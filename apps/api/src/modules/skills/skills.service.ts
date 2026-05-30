import { Injectable } from '@nestjs/common';
import type { Skill, SkillCategory } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface SkillNode {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  icon: string | null;
  children: SkillNode[];
}

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Плоский список навыков (для селекторов в формах). */
  async listFlat(category?: SkillCategory): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /** Дерево навыков-каталога (иерархия parentId → children). */
  async getCatalogTree(category?: SkillCategory): Promise<SkillNode[]> {
    const skills = await this.listFlat(category);
    return this.buildTree(skills);
  }

  /** Сборка вложенного дерева из плоского списка. */
  buildTree(skills: Pick<Skill, 'id' | 'name' | 'slug' | 'category' | 'icon' | 'parentId' | 'sortOrder'>[]): SkillNode[] {
    const byId = new Map<string, SkillNode>();
    const roots: SkillNode[] = [];

    for (const skill of skills) {
      byId.set(skill.id, {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        category: skill.category,
        icon: skill.icon,
        children: [],
      });
    }

    for (const skill of skills) {
      const node = byId.get(skill.id)!;
      if (skill.parentId && byId.has(skill.parentId)) {
        byId.get(skill.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
