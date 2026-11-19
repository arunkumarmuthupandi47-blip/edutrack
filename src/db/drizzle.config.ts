import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

const sqlHost = process.env.SQL_HOST;
const sqlPort = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432;
const sqlDbName = process.env.SQL_DB_NAME || 'postgres';
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!connectionUrl && (!sqlHost || !user || !password)) {
  throw new Error(
    'Set DATABASE_URL (or DIRECT_URL) for Supabase, or SQL_HOST, SQL_ADMIN_USER, and SQL_ADMIN_PASSWORD in environment variables.'
  );
}

const useSsl =
  process.env.DB_SSL === 'true' ||
  Boolean(
    (connectionUrl &&
      (connectionUrl.includes('supabase.co') ||
        connectionUrl.includes('supabase.com'))) ||
      (sqlHost &&
        (sqlHost.includes('supabase.co') || sqlHost.includes('supabase.com')))
  );

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: connectionUrl
    ? {
        url: connectionUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: sqlHost!,
        port: sqlPort,
        user: user!,
        password: password!,
        database: sqlDbName,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});
