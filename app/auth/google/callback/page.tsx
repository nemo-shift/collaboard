'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@features/auth/model/store';

export default function GoogleAuthCallback() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 세션 확인 및 사용자 정보 갱신
        await refreshUser();
        // 대시보드로 리다이렉트
        router.push('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/auth?error=auth_failed');
      }
    };

    handleCallback();
  }, [router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

