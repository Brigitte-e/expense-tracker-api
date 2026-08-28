import { ConflictException, Injectable } from '@nestjs/common';
import {
  CATEGORIES,
  SEED_CATEGORY_RULES,
} from '../categories/category-rules';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ACCOUNTS } from './user-defaults';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, passwordHash: string): Promise<UserRecord> {
    try {
      return await this.prisma.client.orm.public.User.create({
        email,
        passwordHash,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.client.orm.public.User.where({ email }).first();
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.client.orm.public.User.where({ id }).first();
  }

  async provisionDefaults(userId: string): Promise<void> {
    await this.prisma.client.orm.public.Category.createAll(
      CATEGORIES.map((name) => ({ name, userId })),
    );

    const categories = await this.prisma.client.orm.public.Category.where({
      userId,
    }).all();
    const categoryIds = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    await this.prisma.client.orm.public.CategoryRule.createAll(
      SEED_CATEGORY_RULES.flatMap((rule) => {
        const categoryId = categoryIds.get(rule.category);
        if (!categoryId) {
          return [];
        }

        return [
          {
            pattern: rule.pattern,
            categoryId,
            priority: rule.priority,
            userId,
          },
        ];
      }),
    );

    await this.prisma.client.orm.public.Account.createAll(
      DEFAULT_ACCOUNTS.map((account) => ({ ...account, userId })),
    );
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    cause?: { code?: string };
    message?: string;
  };

  return (
    candidate.code === '23505' ||
    candidate.cause?.code === '23505' ||
    (typeof candidate.message === 'string' &&
      /unique|duplicate/i.test(candidate.message))
  );
}
