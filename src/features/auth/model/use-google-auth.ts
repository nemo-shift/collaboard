'use client';

import { useState, useCallback } from 'react';
import { signInWithGoogle } from '@features/auth/api';

interface UseGoogleAuthReturn {
  handleGoogleLogin: () => Promise<void>;
  isAuthenticating: boolean;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleLogin = useCallback(async () => {
    setIsAuthenticating(true);

    try {
      await signInWithGoogle();
      // OAuth는 리다이렉트되므로 여기서는 대기만 함
    } catch (error) {
      console.error('Google login error:', error);
      // TODO: 에러 처리 (토스트 메시지 등)
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    handleGoogleLogin,
    isAuthenticating,
  };
};

