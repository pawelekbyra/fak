import { createTables } from '../lib/db-postgres';

async function main() {
  console.log('Resetting database...');
  await createTables();
  console.log('Database reset complete.');
}

main().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
