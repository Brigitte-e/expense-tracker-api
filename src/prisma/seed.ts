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
    `Seeded ${CATEGORY_NAMES.length} categories and ${accounts.length} accounts`,
  );
  await db.close();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
