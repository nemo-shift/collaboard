'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';

interface PrivateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardName?: string;
  isAuthenticated?: boolean;
}

export const PrivateBoardModal = ({
  isOpen,
  onClose,
  boardName,
  isAuthenticated = false,
}: PrivateBoardModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigate = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">비공개 보드</h2>
          <button
            onClick={handleNavigate}
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
          {boardName && (
            <span className="font-semibold">{boardName}</span>
          )}
          {boardName && ' '}
          이 보드는 비공개 보드입니다. 소유자만 접근할 수 있습니다.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="primary"
            onClick={handleNavigate}
            className="px-6 py-2"
          >
            {isAuthenticated ? '대시보드로 이동' : '홈페이지로 이동'}
          </Button>
        </div>
      </div>
    </div>
  );
};

