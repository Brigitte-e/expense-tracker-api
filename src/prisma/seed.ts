import { db } from './db';

const CATEGORY_NAMES = [
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

async function seed() {
  for (const name of CATEGORY_NAMES) {
    const existing = await db.orm.public.Category.where({ name }).first();
    if (!existing) {
      await db.orm.public.Category.create({ name });
    }
  }

  console.log(`Seeded ${CATEGORY_NAMES.length} categories`);
  await db.close();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
