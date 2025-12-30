'use client';

import { useEffect } from 'react';
import { supabase } from '@shared/api';
import { useAuthStore } from './store';
import { logger } from '@shared/lib';

export const useAuthListener = () => {
  const { setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Refresh token 에러는 세션이 만료된 것으로 간주
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
          clearAuth();
          return;
        }
        logger.error('Session error:', error);
        clearAuth();
        return;
      }
      setUser(session?.user ?? null);
    }).catch((error) => {
      // 예상치 못한 에러 처리
      logger.error('Failed to get session:', error);
      clearAuth();
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_OUT 이벤트 명시적 처리
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearAuth]);
};

