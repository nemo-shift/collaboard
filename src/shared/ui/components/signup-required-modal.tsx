'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';

interface SignupRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignupRequiredModal = ({
  isOpen,
  onClose,
}: SignupRequiredModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignup = () => {
    router.push('/auth?mode=signup');
  };

  const handleLogin = () => {
    router.push('/auth?mode=login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">회원가입이 필요합니다</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          보드에서 작업하려면 회원가입이 필요합니다. 
          보기는 가능하지만 포스트잇 추가, 수정, 삭제 등의 작업은 로그인 후 이용할 수 있습니다.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2"
          >
            취소
          </Button>
          <Button
            variant="secondary"
            onClick={handleLogin}
            className="px-6 py-2"
          >
            로그인
          </Button>
          <Button
            variant="primary"
            onClick={handleSignup}
            className="px-6 py-2"
          >
            회원가입
          </Button>
        </div>
      </div>
    </div>
  );
};

