'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button, InviteModal } from '@shared/ui';
import { BoardSettingsModal } from './board-settings-modal';
import type { CursorPosition } from '@entities/element';

interface BoardToolbarProps {
  boardName?: string;
  boardDescription?: string;
  boardId?: string;
  inviteCode?: string;
  isPublic?: boolean;
  addMode: 'note' | 'image' | null;
  onAddModeChange: (mode: 'note' | 'image' | null) => void;
  onImageButtonClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBoardUpdate?: (updates: { name?: string; description?: string; isPublic?: boolean }) => Promise<void>;
  isOwner?: boolean;
}

export const BoardToolbar = ({
  boardName = '보드 이름',
  boardDescription,
  boardId,
  inviteCode,
  isPublic = false,
  addMode,
  onAddModeChange,
  onImageButtonClick,
  fileInputRef,
  onFileSelect,
  onBoardUpdate,
  isOwner = false,
  onBoardUpdated,
}: BoardToolbarProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(boardName);
  const [editedDescription, setEditedDescription] = useState(boardDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // 초대 링크 생성
  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/board/invite/${inviteCode}`
    : '';

  // boardName이나 boardDescription이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setEditedName(boardName);
  }, [boardName]);

  useEffect(() => {
    setEditedDescription(boardDescription || '');
  }, [boardDescription]);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  const handleSaveName = async () => {
    if (!onBoardUpdate || !isOwner) return;
    
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setEditedName(boardName);
      setIsEditingName(false);
      return;
    }

    if (trimmedName === boardName) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSaving(true);
      await onBoardUpdate({ name: trimmedName });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update board name:', error);
      setEditedName(boardName); // 롤백
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!onBoardUpdate || !isOwner) return;

    const trimmedDescription = editedDescription.trim();
    if (trimmedDescription === (boardDescription || '')) {
      setIsEditingDescription(false);
      return;
    }

    try {
      setIsSaving(true);
      await onBoardUpdate({ description: trimmedDescription || undefined });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update board description:', error);
      setEditedDescription(boardDescription || ''); // 롤백
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelName = () => {
    setEditedName(boardName);
    setIsEditingName(false);
  };

  const handleCancelDescription = () => {
    setEditedDescription(boardDescription || '');
    setIsEditingDescription(false);
  };

  return (
    <div className="flex flex-col border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* 대시보드 링크 */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            title="대시보드로 이동"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span className="text-sm font-medium">대시보드</span>
          </Link>
          <div className="w-px h-6 bg-gray-300 flex-shrink-0"></div>
          
          {/* 보드 이름과 설명 (같은 줄에 배치) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 보드 이름 */}
            <div className="flex items-center gap-2 min-w-0">
              {isEditingName && isOwner ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveName();
                    } else if (e.key === 'Escape') {
                      handleCancelName();
                    }
                  }}
                  disabled={isSaving}
                  className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 
                    className="text-lg font-semibold text-gray-900 truncate"
                    title={boardName}
                  >
                    {boardName}
                  </h1>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="보드 이름 편집"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 보드 설명 (이름 옆에 배치) */}
            {(boardDescription || isEditingDescription || isOwner) && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                {isEditingDescription && isOwner ? (
                  <input
                    ref={descriptionInputRef}
                    type="text"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveDescription();
                      } else if (e.key === 'Escape') {
                        handleCancelDescription();
                      }
                    }}
                    disabled={isSaving}
                    placeholder="보드 설명을 입력하세요"
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-[200px] max-w-md"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      {boardDescription || (isOwner ? '보드 설명을 추가하세요' : '')}
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="보드 설명 편집"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 도구 모음 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() => onAddModeChange(addMode === 'note' ? null : 'note')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                addMode === 'note'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              title="포스트잇 추가"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              포스트잇
            </button>
            <button
              onClick={onImageButtonClick}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                addMode === 'image'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              title="이미지 업로드"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              이미지
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
          </div>

          <Button 
            variant="secondary" 
            className="text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsInviteModalOpen(true);
            }}
          >
            초대
          </Button>
          {isOwner && (
            <Button 
              variant="secondary" 
              className="text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSettingsModalOpen(true);
              }}
            >
              {isPublic ? '공개' : '비공개'}
            </Button>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        inviteLink={inviteLink}
        boardName={boardName}
      />

      {isOwner && (
        <BoardSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          boardName={boardName}
          isPublic={isPublic}
          onUpdate={async (updates) => {
            if (onBoardUpdate) {
              await onBoardUpdate(updates);
            }
          }}
          isLoading={isSaving}
        />
      )}
    </div>
  );
};

