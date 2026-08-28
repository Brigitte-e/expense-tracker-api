import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategorizedTransaction } from '../imports/types/categorized-transaction';
import { NormalizedTransaction } from '../imports/types/normalized-transaction';
import { PrismaService } from '../prisma/prisma.service';
import {
  Category,
  isCategory,
  matchCategory,
  type CategoryRuleMatch,
  type CategoryRuleResponse,
  type CreateCategoryRuleDto,
} from './category-rules';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CategoryRuleRow = {
  id: string;
  pattern: string;
  priority: number;
  categoryId: string;
  category: { name?: unknown };
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async categorize(transaction: NormalizedTransaction): Promise<Category> {
    const rules = await this.loadRules();
    return matchCategory(transaction.description, rules);
  }

  async categorizeAll(
    transactions: NormalizedTransaction[],
  ): Promise<CategorizedTransaction[]> {
    const rules = await this.loadRules();
    return transactions.map((transaction) => ({
      ...transaction,
      category: matchCategory(transaction.description, rules),
    }));
  }

  async findAllRules(): Promise<CategoryRuleResponse[]> {
    const rows =
      await this.prisma.client.orm.public.CategoryRule.include(
        'category',
      ).all();

    return rows
      .map((row) => this.toResponse(row))
      .sort((left, right) => right.priority - left.priority);
  }

  async createRule(dto: CreateCategoryRuleDto): Promise<CategoryRuleResponse> {
    const category = await this.resolveCategory(dto.categoryId);
    if (!category) {
      throw new BadRequestException(`Unknown category: ${dto.categoryId}`);
    }

    const pattern = dto.pattern.toUpperCase();
    const existing = await this.prisma.client.orm.public.CategoryRule.where({
      pattern,
    }).first();

    if (existing) {
      throw new ConflictException(`Rule for pattern ${pattern} already exists`);
    }

    const row = await this.prisma.client.orm.public.CategoryRule.create({
      pattern,
      categoryId: category.id,
      priority: dto.priority,
    });

    return {
      id: row.id,
      pattern: row.pattern,
      categoryId: row.categoryId,
      category: category.name,
      priority: row.priority,
    };
  }

  async removeRule(id: string): Promise<CategoryRuleResponse> {
    const row = await this.prisma.client.orm.public.CategoryRule.where({ id })
      .include('category')
      .first();

    if (!row) {
      throw new NotFoundException(`Category rule ${id} not found`);
    }

    const response = this.toResponse(row);
    await this.prisma.client.orm.public.CategoryRule.where({ id }).delete();
    return response;
  }

  private async loadRules(): Promise<CategoryRuleMatch[]> {
    const rows =
      await this.prisma.client.orm.public.CategoryRule.include(
        'category',
      ).all();

    return rows
      .flatMap((row) => {
        const name = row.category.name;
        if (!isCategory(name)) {
          return [];
        }

        return [
          {
            pattern: row.pattern,
            category: name,
            priority: row.priority,
          },
        ];
      })
      .sort((left, right) => right.priority - left.priority);
  }

  private async resolveCategory(categoryId: string) {
    if (UUID.test(categoryId)) {
      const byId = await this.prisma.client.orm.public.Category.where({
        id: categoryId,
      }).first();
      if (byId) {
        return byId;
      }
    }

    return this.prisma.client.orm.public.Category.where({
      name: categoryId.toUpperCase(),
    }).first();
  }

  private toResponse(row: CategoryRuleRow): CategoryRuleResponse {
    if (typeof row.category.name !== 'string') {
      throw new Error('Category rule is missing category name');
    }

    return {
      id: row.id,
      pattern: row.pattern,
      categoryId: row.categoryId,
      category: row.category.name,
      priority: row.priority,
    };
  }
}
