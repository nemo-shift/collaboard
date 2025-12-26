'use client';

import { supabase } from '@shared/api';

export async function signInWithGoogle() {
  // 클라이언트 사이드에서만 실행 가능
  if (typeof window === 'undefined') {
    throw new Error('signInWithGoogle can only be called on the client side');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/google/callback`,
      queryParams: {
        prompt: 'select_account', // 계정 선택 화면 강제 표시
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
        name: displayName,
      },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/google/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(error.message);
  }

  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    // Refresh token 에러는 세션이 만료된 것으로 간주하고 null 반환
    if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
      // 세션을 명시적으로 클리어
      await supabase.auth.signOut();
      return null;
    }
    throw new Error(error.message);
  }
  
  return session;
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetPasswordForEmail(email: string) {
  if (typeof window === 'undefined') {
    throw new Error('resetPasswordForEmail can only be called on the client side');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 비밀번호 업데이트 (재설정)
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

