import 'dotenv/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

// Prisma 8 CLI expects definePrismaConfig's `$prismaConfig` marker.
// `@prisma/cli-engine` only exposes ESM `import` and cannot be loaded
// while this config is evaluated.
export default Object.freeze({
  $prismaConfig: 1,
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
