import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * 공개 사용자 정보 (public.users 테이블)
 * auth.users의 확장 정보를 담는 테이블
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * @deprecated Use User instead. UserProfile is kept for backward compatibility.
 */
export type UserProfile = User;

export type AuthUser = SupabaseUser | null;

