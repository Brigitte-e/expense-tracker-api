import { db } from './db';

async function seed() {
  console.log(
    'Default categories, rules, and accounts are created when a user registers.',
  );
  await db.close();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exit(1);
});
