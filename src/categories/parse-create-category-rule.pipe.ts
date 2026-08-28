import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { CreateCategoryRuleDto } from './category-rules';

@Injectable()
export class ParseCreateCategoryRulePipe implements PipeTransform<
  unknown,
  CreateCategoryRuleDto
> {
  transform(body: unknown): CreateCategoryRuleDto {
    return parseCreateCategoryRule(body);
  }
}

export function parseCreateCategoryRule(body: unknown): CreateCategoryRuleDto {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Body must be an object');
  }

  const record = body as Record<string, unknown>;
  const pattern = readRequiredString(record.pattern, 'pattern');
  const categoryId = readRequiredString(record.categoryId, 'categoryId');

  return {
    pattern,
    categoryId,
    priority: readPriority(record.priority),
  };
}

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} is required`);
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    throw new BadRequestException(`${name} is required`);
  }

  return trimmed;
}

function readPriority(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const priority = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(priority)) {
    throw new BadRequestException('priority must be an integer');
  }

  return priority;
}
