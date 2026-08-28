import { CATEGORIES, SEED_CATEGORY_RULES } from '../categories/category-rules';
import { db } from './db';

async function seed() {
  for (const name of CATEGORIES) {
    const existing = await db.orm.public.Category.where({ name }).first();
    if (!existing) {
      await db.orm.public.Category.create({ name });
    }
  }

  const categories = await db.orm.public.Category.all();
  const categoryIds = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const rule of SEED_CATEGORY_RULES) {
    const categoryId = categoryIds.get(rule.category);
    if (!categoryId) {
      continue;
    }

    const existing = await db.orm.public.CategoryRule.where({
      pattern: rule.pattern,
    }).first();
    if (!existing) {
      await db.orm.public.CategoryRule.create({
        pattern: rule.pattern,
        categoryId,
        priority: rule.priority,
      });
    }
  }

  const accounts = [
    { name: 'Revolut', bank: 'REVOLUT' as const, currency: 'EUR' },
    { name: 'Monobank', bank: 'MONOBANK' as const, currency: 'UAH' },
    { name: 'PrivatBank', bank: 'PRIVAT' as const, currency: 'UAH' },
  ];

  for (const account of accounts) {
    const existing = await db.orm.public.Account.where({
      name: account.name,
    }).first();
    if (!existing) {
      await db.orm.public.Account.create(account);
    }
  }

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${SEED_CATEGORY_RULES.length} rules, and ${accounts.length} accounts`,
  );
  await db.close();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
