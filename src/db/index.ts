import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function getConnectionString(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.DIRECT_URL,
  ];
  for (const url of candidates) {
    if (
      url &&
      !url.includes('[YOUR-DB-PASSWORD]') &&
      !url.includes('[YOUR-PASSWORD]') &&
      !url.includes('[PROJECT-REF]')
    ) {
      return url;
    }
  }
  return undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getConnectionString() || process.env.SQL_HOST);
}

function shouldUseSsl(target?: string): boolean {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true') return true;
  if (!target) return false;
  return (
    target.includes('supabase.co') ||
    target.includes('supabase.com') ||
    target.includes('pooler.supabase.com') ||
    target.includes('sslmode=require')
  );
}

export function buildPoolConfig(): PoolConfig {
  const connectionString = getConnectionString();

  if (connectionString) {
    return {
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  const host = process.env.SQL_HOST;
  const port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432;

  return {
    host,
    port,
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
    database: process.env.SQL_DB_NAME || 'postgres',
    ssl: shouldUseSsl(host) ? { rejectUnauthorized: false } : undefined,
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(buildPoolConfig());

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

export function getSupabaseRestConfig(): { url?: string; key?: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return { url, key };
}

export async function checkDatabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  mode?: 'postgres' | 'supabase-rest';
  supabaseUrl?: string;
  error?: string;
}> {
  const configured = isDatabaseConfigured();
  const restConfig = getSupabaseRestConfig();

  if (!configured) {
    if (restConfig.url && restConfig.key) {
      return {
        configured: true,
        connected: true,
        mode: 'supabase-rest',
        supabaseUrl: restConfig.url,
      };
    }
    return {
      configured: false,
      connected: false,
      error: 'Database credentials not configured (set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL).',
    };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return {
        configured: true,
        connected: true,
        mode: 'postgres',
        supabaseUrl: restConfig.url,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      mode: 'postgres',
      supabaseUrl: restConfig.url,
      error: err?.message || 'Failed to connect to database.',
    };
  }
}
