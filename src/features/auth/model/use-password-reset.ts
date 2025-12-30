'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { resetPasswordForEmail, updatePassword } from '@features/auth/api';
import { validatePassword, checkPasswordMatch } from '@features/auth/lib';
import { logger, translateAuthError } from '@shared/lib';

interface UsePasswordResetReturn {
  // 재설정 요청
  email: string;
  setEmail: (email: string) => void;
  handleRequestReset: (e: React.FormEvent) => Promise<void>;
  isRequesting: boolean;
  requestError: string | null;
  requestSuccess: boolean;

  // 비밀번호 업데이트
  newPassword: string;
  confirmPassword: string;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
  isUpdating: boolean;
  updateError: string | null;
  passwordValidation: ReturnType<typeof validatePassword>;
  isPasswordMatch: boolean;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // 비밀번호 유효성 검사
  const passwordValidation = validatePassword(newPassword);
  const isPasswordMatch = checkPasswordMatch(newPassword, confirmPassword);

  const handleRequestReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsRequesting(true);
      setRequestError(null);
      setRequestSuccess(false);

      try {
        await resetPasswordForEmail(email);
        setRequestSuccess(true);
        setEmail(''); // 성공 시 이메일 초기화
      } catch (err) {
        let errorMessage = '비밀번호 재설정 요청에 실패했습니다.';
        if (err instanceof Error) {
          errorMessage = translateAuthError(err.message);
        }
        setRequestError(errorMessage);
        logger.error('Password reset request error:', err);
      } finally {
        setIsRequesting(false);
      }
    },
    [email]
  );

  const handleUpdatePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdating(true);
      setUpdateError(null);

      // 비밀번호 유효성 검사
      if (!passwordValidation.isValid) {
        setUpdateError(passwordValidation.errors.join(', '));
        setIsUpdating(false);
        return;
      }

      // 비밀번호 일치 확인
      if (!isPasswordMatch) {
        setUpdateError('비밀번호가 일치하지 않습니다.');
        setIsUpdating(false);
        return;
      }

      try {
        await updatePassword(newPassword);
        // 성공 시 로그인 페이지로 이동
        router.push('/auth?reset=success');
      } catch (err) {
        let errorMessage = '비밀번호 변경에 실패했습니다.';
        if (err instanceof Error) {
          errorMessage = translateAuthError(err.message);
        }
        setUpdateError(errorMessage);
        logger.error('Password update error:', err);
      } finally {
        setIsUpdating(false);
      }
    },
    [newPassword, confirmPassword, passwordValidation, isPasswordMatch, router]
  );

  return {
    email,
    setEmail,
    handleRequestReset,
    isRequesting,
    requestError,
    requestSuccess,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    handleUpdatePassword,
    isUpdating,
    updateError,
    passwordValidation,
    isPasswordMatch,
  };
};

