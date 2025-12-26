'use client';

import { useState } from 'react';
import { Button } from './button';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  boardName?: string;
  isPublic?: boolean;
}

export const InviteModal = ({
  isOpen,
  onClose,
  inviteLink,
  boardName,
  isPublic = true,
}: InviteModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">보드 초대</h2>
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

        {boardName && (
          <p className="text-gray-600 mb-4">
            <span className="font-semibold">{boardName}</span> 보드를 초대합니다
          </p>
        )}

        {isPublic && inviteLink ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                초대 링크
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <Button
                  onClick={handleCopy}
                  variant={copied ? 'primary' : 'secondary'}
                  className="px-4 py-2 whitespace-nowrap"
                >
                  {copied ? '복사됨!' : '복사'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              이 링크를 공유하면 다른 사용자가 보드에 참여할 수 있습니다.
            </p>
          </>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              이 보드는 비공개 보드입니다. 초대 링크를 생성하려면 보드를 공개로 설정해주세요.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="px-6 py-2">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

