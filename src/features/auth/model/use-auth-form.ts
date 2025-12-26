'use client';

import { useState, useCallback } from 'react';

interface AuthFormData {
  username: string;
  email: string;
  displayName: string;
}

interface UseAuthFormReturn {
  formData: AuthFormData;
  setFormData: React.Dispatch<React.SetStateAction<AuthFormData>>;
  handleFieldChange: (field: keyof AuthFormData, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const useAuthForm = (): UseAuthFormReturn => {
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: '',
    displayName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        // TODO: 실제 인증 API 연동 시 구현
        // 예: await signUpWithEmail(formData);
        
        // 임시: 성공 시 대시보드로 이동
        // router.push('/dashboard');
      } catch (error) {
        console.error('Sign up error:', error);
        // TODO: 에러 처리 (토스트 메시지 등)
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  return {
    formData,
    setFormData,
    handleFieldChange,
    handleSubmit,
    isSubmitting,
  };
};

