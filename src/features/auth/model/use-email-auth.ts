'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail } from '@features/auth/api';
import { useAuthStore } from './store';
import { validatePassword, checkPasswordMatch } from '@features/auth/lib';
import { logger } from '@shared/lib';

interface EmailAuthData {
  email: string;
  password: string;
}

interface SignupData extends EmailAuthData {
  displayName: string;
  passwordConfirm: string;
}

interface UseEmailAuthReturn {
  loginData: EmailAuthData;
  signupData: SignupData;
  handleLoginFieldChange: (field: keyof EmailAuthData, value: string) => void;
  handleSignupFieldChange: (field: keyof SignupData, value: string) => void;
  handleEmailLogin: (e: React.FormEvent) => Promise<void>;
  handleEmailSignup: (e: React.FormEvent) => Promise<void>;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  error: string | null;
  passwordValidation: ReturnType<typeof validatePassword>;
  isPasswordMatch: boolean;
}

export const useEmailAuth = (): UseEmailAuthReturn => {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [loginData, setLoginData] = useState<EmailAuthData>({
    email: '',
    password: '',
  });
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    displayName: '',
    passwordConfirm: '',
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 비밀번호 유효성 검사
  const passwordValidation = useMemo(
    () => validatePassword(signupData.password),
    [signupData.password]
  );

  // 비밀번호 일치 여부
  const isPasswordMatch = useMemo(
    () => checkPasswordMatch(signupData.password, signupData.passwordConfirm),
    [signupData.password, signupData.passwordConfirm]
  );

  const handleLoginFieldChange = useCallback((field: keyof EmailAuthData, value: string) => {
    setLoginData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  }, []);

  const handleSignupFieldChange = useCallback(
    (field: keyof SignupData, value: string) => {
      setSignupData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    []
  );

  const handleEmailLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoggingIn(true);
      setError(null);

      try {
        await signInWithEmail(loginData.email, loginData.password);
        // 사용자 정보 갱신
        await refreshUser();
        // 대시보드로 이동
        router.push('/dashboard');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '로그인에 실패했습니다.';
        setError(errorMessage);
        logger.error('Email login error:', err);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [loginData, router, refreshUser]
  );

  const handleEmailSignup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSigningUp(true);
      setError(null);

      // 비밀번호 유효성 검사
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors.join(', '));
        setIsSigningUp(false);
        return;
      }

      // 비밀번호 일치 확인
      if (!isPasswordMatch) {
        setError('비밀번호가 일치하지 않습니다.');
        setIsSigningUp(false);
        return;
      }

      try {
        const result = await signUpWithEmail(
          signupData.email,
          signupData.password,
          signupData.displayName
        );

        // 이메일 확인이 필요한 경우
        if (result.user && !result.session) {
          // 이메일 확인 메시지 표시 (추후 토스트로 개선 가능)
          alert('이메일 확인 링크를 발송했습니다. 이메일을 확인해주세요.');
          return;
        }

        // 세션이 있으면 바로 로그인된 상태
        if (result.session) {
          await refreshUser();
          router.push('/dashboard');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
        setError(errorMessage);
        logger.error('Email signup error:', err);
      } finally {
        setIsSigningUp(false);
      }
    },
    [signupData, passwordValidation, isPasswordMatch, router, refreshUser]
  );

  return {
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
  };
};

