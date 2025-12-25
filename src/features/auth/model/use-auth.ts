'use client';

import { useAuthStore } from './store';
import { signOut as signOutApi } from '@features/auth/api';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { user, userProfile, isLoading, isInitialized, isAnonymous, clearAuth } = useAuthStore();

  const signOut = async () => {
    try {
      await signOutApi();
      clearAuth();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      // 에러가 발생해도 상태는 초기화
      clearAuth();
    }
  };

  return {
    user,
    userProfile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    isAnonymous, // 어나니머스 상태 반환
    signOut,
  };
};

