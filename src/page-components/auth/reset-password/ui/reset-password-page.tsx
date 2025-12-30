'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@shared/ui';
import { usePasswordReset } from '@features/auth';
import { supabase } from '@shared/api';

export const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const {
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    handleUpdatePassword,
    isUpdating,
    updateError,
    passwordValidation,
    isPasswordMatch,
  } = usePasswordReset();

  useEffect(() => {
    // URL에서 토큰 확인 (Supabase가 자동으로 처리하지만 확인용)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidToken(true);
      } else {
        // 세션이 없으면 재설정 요청 페이지로 리다이렉트
        setIsValidToken(false);
        setTimeout(() => {
          router.push('/auth/reset-request');
        }, 2000);
      }
    };

    checkSession();
  }, [router]);

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">유효하지 않은 링크입니다.</p>
          <p className="text-sm text-gray-500">재설정 요청 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            새 비밀번호 설정
          </h1>
          <p className="text-base text-gray-600">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8 sm:p-10">
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {updateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{updateError}</p>
              </div>
            )}

            <div>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                label="새 비밀번호"
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={
                  newPassword
                    ? passwordValidation.isValid
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              {newPassword && !passwordValidation.isValid && (
                <div className="mt-1.5 space-y-1">
                  {passwordValidation.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-600">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
              {newPassword && passwordValidation.isValid && (
                <p className="mt-1.5 text-xs text-green-600">✓ 비밀번호 조건을 만족합니다</p>
              )}
            </div>

            <div>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={
                  confirmPassword
                    ? isPasswordMatch
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              {confirmPassword && (
                <p
                  className={`mt-1.5 text-xs ${
                    isPasswordMatch ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isPasswordMatch ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? '변경 중...' : '비밀번호 변경'}
            </Button>

            <div className="text-center">
              <Link
                href="/auth"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

