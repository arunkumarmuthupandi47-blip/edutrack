import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch {
    // Ignore when import.meta.env is unavailable
  }
  return undefined;
};

export const supabaseUrl =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('SUPABASE_URL') ||
  'https://hbczzgniouohvlimxnas.supabase.co';

export const supabasePublishableKey =
  getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_ANON_KEY') ||
  'sb_publishable_qsh4QIQ0kBvijrRdi5_HSQ_SQBKtF34';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
