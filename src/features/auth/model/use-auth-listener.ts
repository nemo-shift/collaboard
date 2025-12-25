'use client';

import { useEffect } from 'react';
import { supabase } from '@shared/api';
import { useAuthStore } from './store';

export const useAuthListener = () => {
  const { setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearAuth]);
};

