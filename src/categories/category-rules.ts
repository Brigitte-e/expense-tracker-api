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

export interface CategoryRule {
  keywords: string[];
  category: Category;
}

export const categoryRules: CategoryRule[] = [
  {
    keywords: ['LIDL', 'MERCADONA', 'CARREFOUR'],
    category: 'GROCERIES',
  },
  {
    keywords: ['MCDONALDS', 'BURGER KING', 'KFC'],
    category: 'RESTAURANTS',
  },
  {
    keywords: ['AMAZON', 'ZARA', 'H&M'],
    category: 'SHOPPING',
  },
  {
    keywords: ['UBER', 'CABIFY', 'METRO'],
    category: 'TRANSPORT',
  },
  {
    keywords: ['SALARY'],
    category: 'SALARY',
  },
];

export function matchCategory(description: string): Category {
  const text = description.toUpperCase();

  for (const rule of categoryRules) {
    const matchesRule = rule.keywords.some((keyword) =>
      text.includes(keyword.toUpperCase()),
    );

    if (matchesRule) {
      return rule.category;
    }
  }

  return 'OTHER';
}
