'use client';

import { useState, useEffect } from 'react';
import { Button } from '@shared/ui';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardName?: string;
  isPublic: boolean;
  onUpdate: (updates: { isPublic?: boolean }) => Promise<void>;
  isLoading?: boolean;
}

export const BoardSettingsModal = ({
  isOpen,
  onClose,
  boardName,
  isPublic,
  onUpdate,
  isLoading = false,
}: BoardSettingsModalProps) => {
  const [localIsPublic, setLocalIsPublic] = useState(isPublic);
  const [isSaving, setIsSaving] = useState(false);

  // isPublic이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setLocalIsPublic(isPublic);
  }, [isPublic]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (localIsPublic === isPublic) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate({ isPublic: localIsPublic });
      // 업데이트 후 잠시 대기 (DB 반영 시간)
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose();
    } catch (error) {
      console.error('Failed to update board settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalIsPublic(isPublic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">보드 설정</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving || isLoading}
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
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{boardName}</span> 보드 설정
          </p>
        )}

        <div className="space-y-6">
          {/* 현재 상태 표시 */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">현재 상태:</span>
              <span className={`text-sm font-semibold ${isPublic ? 'text-blue-600' : 'text-gray-600'}`}>
                {isPublic ? '공개 보드' : '비공개 보드'}
              </span>
            </div>
          </div>

          {/* 공개/비공개 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              공개 설정 변경
            </label>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                localIsPublic 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={localIsPublic}
                  onChange={() => setLocalIsPublic(true)}
                  disabled={isSaving || isLoading}
                  className={`w-4 h-4 text-gray-900 focus:ring-gray-900 focus:ring-2 ${
                    localIsPublic 
                      ? 'border-0 outline-none [&]:border-0' 
                      : 'border border-gray-300'
                  }`}
                  style={localIsPublic ? { 
                    border: 'none !important', 
                    outline: 'none',
                    boxShadow: 'none'
                  } : undefined}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    공개 보드
                    {localIsPublic && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        선택됨
                      </span>
                    )}
                  </div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                !localIsPublic 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!localIsPublic}
                  onChange={() => setLocalIsPublic(false)}
                  disabled={isSaving || isLoading}
                  className={`w-4 h-4 text-gray-900 focus:ring-gray-900 focus:ring-2 ${
                    !localIsPublic 
                      ? 'border-0 outline-none [&]:border-0' 
                      : 'border border-gray-300'
                  }`}
                  style={!localIsPublic ? { 
                    border: 'none !important', 
                    outline: 'none',
                    boxShadow: 'none'
                  } : undefined}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    비공개 보드
                    {!localIsPublic && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        선택됨
                      </span>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {localIsPublic && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
               공개로 설정하면 다른 사용자를 초대할 수 있습니다.
              </p>
            </div>
          )}
          
          {!localIsPublic && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                비공개로 설정하면 다른 사용자를 초대할 수 없습니다.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6 py-2"
            disabled={isSaving || isLoading}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="px-6 py-2"
            disabled={isSaving || isLoading}
          >
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
};

