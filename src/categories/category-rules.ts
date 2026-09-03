import { ApiProperty } from '@nestjs/swagger';

export const CATEGORIES = [
  'GROCERIES',
  'RESTAURANTS',
  'TRANSPORT',
  'SHOPPING',
  'ENTERTAINMENT',
  'HEALTH',
  'HOUSING',
  'SUBSCRIPTIONS',
  'SALARY',
  'TRANSFER',
  'OTHER',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === 'string' &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}

export interface CategoryRuleMatch {
  pattern: string;
  category: Category;
  priority: number;
}

export const SEED_CATEGORY_RULES: CategoryRuleMatch[] = [
  { pattern: 'LIDL', category: 'GROCERIES', priority: 0 },
  { pattern: 'MERCADONA', category: 'GROCERIES', priority: 0 },
  { pattern: 'CARREFOUR', category: 'GROCERIES', priority: 0 },
  { pattern: 'MCDONALDS', category: 'RESTAURANTS', priority: 0 },
  { pattern: 'BURGER KING', category: 'RESTAURANTS', priority: 0 },
  { pattern: 'KFC', category: 'RESTAURANTS', priority: 0 },
  { pattern: 'AMAZON', category: 'SHOPPING', priority: 0 },
  { pattern: 'ZARA', category: 'SHOPPING', priority: 0 },
  { pattern: 'H&M', category: 'SHOPPING', priority: 0 },
  { pattern: 'UBER', category: 'TRANSPORT', priority: 0 },
  { pattern: 'CABIFY', category: 'TRANSPORT', priority: 0 },
  { pattern: 'METRO', category: 'TRANSPORT', priority: 0 },
  { pattern: 'SALARY', category: 'SALARY', priority: 0 },
  { pattern: 'NETFLIX', category: 'SUBSCRIPTIONS', priority: 0 },
];

export interface CreateCategoryRuleDto {
  pattern: string;
  categoryId: string;
  priority: number;
}

export class CreateCategoryRuleBody implements CreateCategoryRuleDto {
  @ApiProperty({ type: String, example: 'NETFLIX' })
  pattern: string;

  @ApiProperty({ type: String, example: 'SUBSCRIPTIONS' })
  categoryId: string;

  @ApiProperty({ type: Number, example: 0, default: 0, required: false })
  priority: number;
}

export interface CategoryRuleResponse {
  id: string;
  pattern: string;
  categoryId: string;
  category: string;
  priority: number;
}

export function matchCategory(
  description: string,
  rules: readonly CategoryRuleMatch[],
): Category {
  const text = description.toUpperCase();
  const sorted = [...rules].sort(
    (left, right) => right.priority - left.priority,
  );

  for (const rule of sorted) {
    if (text.includes(rule.pattern.toUpperCase())) {
      return rule.category;
    }
  }

  return 'OTHER';
}
