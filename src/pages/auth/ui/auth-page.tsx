'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, GoogleButton } from '@shared/ui';
import { useEmailAuth, useGoogleAuth } from '@features/auth';

type AuthMode = 'login' | 'signup';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // URL 파라미터에서 성공 메시지 확인
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  
  // 컴포넌트 마운트 시 URL 파라미터 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'success') {
        setShowResetSuccess(true);
        // URL에서 파라미터 제거
        window.history.replaceState({}, '', '/auth');
        // 5초 후 메시지 숨기기
        setTimeout(() => setShowResetSuccess(false), 5000);
      }
    }
  }, []);

  // 이메일 인증 로직
  const {
    loginData,
    signupData,
    handleLoginFieldChange,
    handleSignupFieldChange,
    handleEmailLogin,
    handleEmailSignup,
    isLoggingIn,
    isSigningUp,
    error,
    passwordValidation,
    isPasswordMatch,
  } = useEmailAuth();

  // Google 로그인 로직
  const { handleGoogleLogin, isAuthenticating } = useGoogleAuth();

  const isSubmitting = isLoggingIn || isSigningUp || isAuthenticating;

  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
          <p className="text-base text-gray-600">
            {mode === 'login'
              ? '계정에 로그인하여 시작하세요'
              : '새 계정을 만들어 아이디어를 공유하세요'}
          </p>
        </div>

        {/* Auth Card - Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8 sm:p-10">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-50 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Google Login Button */}
          <div className="mb-6">
            <GoogleButton
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full"
            >
              {isAuthenticating
                ? '처리 중...'
                : mode === 'login'
                  ? 'Google로 로그인'
                  : 'Google로 회원가입'}
            </GoogleButton>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/80 text-gray-500">또는</span>
            </div>
          </div>

          {/* Success Message */}
          {showResetSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Form */}
          {mode === 'login' ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label="이메일"
                placeholder="이메일을 입력하세요"
                value={loginData.email}
                onChange={(e) => handleLoginFieldChange('email', e.target.value)}
                required
                autoComplete="email"
              />

              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="비밀번호"
                  placeholder="비밀번호를 입력하세요"
                  value={loginData.password}
                  onChange={(e) => handleLoginFieldChange('password', e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="mt-2 text-right">
                  <Link
                    href="/auth/reset-request"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmailSignup} className="space-y-5">
              <Input
                id="displayName"
                name="displayName"
                label="이름"
                placeholder="이름을 입력하세요"
                value={signupData.displayName}
                onChange={(e) => handleSignupFieldChange('displayName', e.target.value)}
                required
                autoComplete="name"
              />

              <Input
                id="signup-email"
                name="email"
                type="email"
                label="이메일"
                placeholder="이메일을 입력하세요"
                value={signupData.email}
                onChange={(e) => handleSignupFieldChange('email', e.target.value)}
                required
                autoComplete="email"
              />

              <div>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  label="비밀번호"
                  placeholder="비밀번호를 입력하세요"
                  value={signupData.password}
                  onChange={(e) => handleSignupFieldChange('password', e.target.value)}
                  required
                  autoComplete="new-password"
                  className={
                    signupData.password
                      ? passwordValidation.isValid
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:ring-red-500'
                      : ''
                  }
                />
                {signupData.password && !passwordValidation.isValid && (
                  <div className="mt-1.5 space-y-1">
                    {passwordValidation.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600">
                        • {err}
                      </p>
                    ))}
                  </div>
                )}
                {signupData.password && passwordValidation.isValid && (
                  <p className="mt-1.5 text-xs text-green-600">✓ 비밀번호 조건을 만족합니다</p>
                )}
              </div>

              <div>
                <Input
                  id="signup-password-confirm"
                  name="passwordConfirm"
                  type="password"
                  label="비밀번호 확인"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={signupData.passwordConfirm}
                  onChange={(e) => handleSignupFieldChange('passwordConfirm', e.target.value)}
                  required
                  autoComplete="new-password"
                  className={
                    signupData.passwordConfirm
                      ? isPasswordMatch
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:ring-red-500'
                      : ''
                  }
                />
                {signupData.passwordConfirm && (
                  <p
                    className={`mt-1.5 text-xs ${
                      isPasswordMatch ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPasswordMatch ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                {isSigningUp ? '회원가입 중...' : '회원가입'}
              </Button>
            </form>
          )}

          {/* Terms */}
          {mode === 'signup' && (
            <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
              계속 진행하면{' '}
              <Link href="#" className="underline hover:text-gray-900 transition-colors">
                이용약관
              </Link>
              과{' '}
              <Link href="#" className="underline hover:text-gray-900 transition-colors">
                개인정보처리방침
              </Link>
              에 동의하는 것입니다.
            </p>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
};
