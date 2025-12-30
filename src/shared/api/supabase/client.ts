import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 런타임에만 체크 (빌드 타임에는 체크하지 않음)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// 빌드 타임에는 기본값 사용 (실제 사용 시 런타임에서 체크됨)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

