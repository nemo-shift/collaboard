'use client';

import { useEffect } from 'react';
import { useAuthListener } from '@features/auth/model/use-auth-listener';
import { useAuthStore } from '@features/auth/model/store';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { initialize, isInitialized } = useAuthStore();
  
  // 인증 상태 리스너 등록
  useAuthListener();

  // 초기화
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return <>{children}</>;
};

