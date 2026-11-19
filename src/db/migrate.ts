import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDatabaseConfigured, pool } from './index.ts';

export async function runMigrations(): Promise<{
  applied: string[];
}> {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'Database is not configured. Please set DATABASE_URL (Supabase connection string) or SQL_HOST in your .env file.'
    );
  }

  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return { applied: [] };
  }

  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );
    `);

    for (const file of sqlFiles) {
      const existing = await client.query(
        'SELECT filename FROM public._schema_migrations WHERE filename = $1',
        [file]
      );
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);

      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO public._schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
          [file]
        );
        applied.push(file);
      }
    }

    return { applied };
  } finally {
    client.release();
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runMigrations()
    .then(({ applied }) => {
      if (applied.length > 0) {
        console.log(`Applied ${applied.length} Supabase migration(s):`, applied.join(', '));
      } else {
        console.log('Supabase database schema is up to date.');
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
