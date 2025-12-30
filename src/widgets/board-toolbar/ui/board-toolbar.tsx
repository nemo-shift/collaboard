'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button, InviteModal, Tooltip } from '@shared/ui';
import { BoardSettingsModal } from './board-settings-modal';
import { useEditableField } from '@features/board';
import { useTheme } from '@shared/lib';

interface BoardToolbarProps {
  boardName?: string;
  boardDescription?: string;
  boardId?: string;
  inviteCode?: string;
  isPublic?: boolean;
  addMode: 'note' | 'image' | 'text' | null;
  onAddModeChange: (mode: 'note' | 'image' | 'text' | null) => void;
  onImageButtonClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBoardUpdate?: (updates: { name?: string; description?: string; isPublic?: boolean }) => Promise<void>;
  isOwner?: boolean;
  onModalStateChange?: (isOpen: boolean) => void;
  isAnonymous?: boolean;
  onEditBlocked?: () => void;
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
  onModalStateChange,
  isAnonymous = false,
  onEditBlocked,
}: BoardToolbarProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 모달 상태 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isInviteModalOpen || isSettingsModalOpen);
    }
  }, [isInviteModalOpen, isSettingsModalOpen, onModalStateChange]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 보드 툴바 높이를 CSS 변수로 설정 (동적 측정)
  useEffect(() => {
    if (!toolbarRef.current) return;

    const updateHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight;
        document.documentElement.style.setProperty('--board-toolbar-height', `${height}px`);
      }
    };

    // 초기 높이 설정
    updateHeight();

    // ResizeObserver로 높이 변경 감지
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(toolbarRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [boardName, boardDescription, isOwner, addMode]);

  // 보드 이름 편집 훅
  const nameField = useEditableField({
    initialValue: boardName,
    onSave: async (value) => {
      if (!onBoardUpdate || !isOwner) return;
      await onBoardUpdate({ name: value });
    },
    enabled: !!onBoardUpdate && isOwner,
  });

  // 보드 설명 편집 훅
  const descriptionField = useEditableField({
    initialValue: boardDescription || '',
    onSave: async (value) => {
      if (!onBoardUpdate || !isOwner) return;
      await onBoardUpdate({ description: value || undefined });
    },
    enabled: !!onBoardUpdate && isOwner,
  });

  // 초대 링크 생성
  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/board/invite/${inviteCode}`
    : '';

  const isSaving = nameField.isSaving || descriptionField.isSaving;
  const { classes } = useTheme();

  return (
    <div 
      ref={toolbarRef}
      data-board-toolbar
      className={`fixed top-16 left-0 right-0 z-40 flex flex-col border-b ${classes.border} ${classes.bgSurface}`}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* 대시보드 링크 */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 ${classes.textMuted} hover:opacity-80 transition-colors flex-shrink-0`}
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
          <div className={`w-px h-6 ${classes.borderSubtle} flex-shrink-0`}></div>
          
          {/* 보드 이름과 설명 (같은 줄에 배치) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 보드 이름 */}
            <div className="flex items-center gap-2 min-w-0">
              {nameField.isEditing && isOwner ? (
                <div className="relative flex items-center">
                  <input
                    ref={nameField.inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={nameField.editedValue}
                    onChange={(e) => nameField.setEditedValue(e.target.value)}
                    onBlur={(e) => {
                      // 다른 입력 필드로 포커스가 이동하는 경우는 제외
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (!relatedTarget || !relatedTarget.closest('[data-board-toolbar]')) {
                        nameField.handleSave();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        nameField.handleSave();
                      } else if (e.key === 'Escape') {
                        nameField.handleCancel();
                      }
                    }}
                    disabled={isSaving}
                    className={`text-lg font-semibold ${classes.text} ${classes.border} rounded px-2 py-1 pr-8 focus:outline-none focus:ring-2 ${classes.borderFocus} focus:border-transparent min-w-0 ${classes.bg}`}
                  />
                  <div className="absolute right-2 pointer-events-none">
                    <span className={`text-xs ${classes.textMuted} opacity-50`}>
                      ENTER
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 
                    className={`text-lg font-semibold ${classes.text} truncate`}
                  >
                    {boardName}
                  </h1>
                  {isOwner && (
                    <Tooltip content="보드 이름 편집" position="bottom">
                    <button
                      onClick={() => nameField.setIsEditing(true)}
                      aria-label="보드 이름 편집"
                        className={`flex-shrink-0 p-1 ${classes.textMuted} hover:opacity-80 transition-colors`}
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
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {/* 보드 설명 (이름 옆에 배치) */}
            {(boardDescription || descriptionField.isEditing || isOwner) && (
              <div className="flex items-center gap-2">
                <span className={classes.textMuted}>•</span>
                {descriptionField.isEditing && isOwner ? (
                  <div className="relative flex items-center">
                    <input
                      ref={descriptionField.inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={descriptionField.editedValue}
                      onChange={(e) => descriptionField.setEditedValue(e.target.value)}
                      onBlur={(e) => {
                        // 다른 입력 필드로 포커스가 이동하는 경우는 제외
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('[data-board-toolbar]')) {
                          descriptionField.handleSave();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          descriptionField.handleSave();
                        } else if (e.key === 'Escape') {
                          descriptionField.handleCancel();
                        }
                      }}
                      disabled={isSaving}
                      placeholder="보드 설명을 입력하세요"
                      className={`text-sm ${classes.textBody} rounded px-2 py-1 pr-8 focus:outline-none focus:ring-2 ${classes.borderFocus} focus:border-transparent min-w-[200px] max-w-md border ${classes.border} ${classes.bg}`}
                    />
                    <div className="absolute right-2 pointer-events-none">
                      <span className={`text-xs ${classes.textMuted} opacity-50`}>
                        ENTER
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${classes.textBody}`}>
                      {boardDescription || (isOwner ? '보드 설명을 추가하세요' : '')}
                    </p>
                    {isOwner && (
                      <Tooltip content="보드 설명 편집" position="bottom">
                      <button
                        onClick={() => descriptionField.setIsEditing(true)}
                        aria-label="보드 설명 편집"
                          className={`flex-shrink-0 p-1 ${classes.textMuted} hover:opacity-80 transition-colors`}
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
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 도구 모음 */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 border-r ${classes.border} pr-2 mr-2`}>
            <Tooltip content="포스트잇 추가" position="bottom">
            <button
              onClick={() => onAddModeChange(addMode === 'note' ? null : 'note')}
              aria-label="포스트잇 추가"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border ${
                addMode === 'note'
                    ? `${classes.primary} text-white dark:text-[#1a1a1a]`
                    : `${classes.bgSurface} ${classes.textBody} ${classes.border} hover:bg-[var(--color-surface-hover)]`
              }`}
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
            </Tooltip>
            <Tooltip content="이미지 업로드" position="bottom">
            <button
              onClick={onImageButtonClick}
              aria-label="이미지 업로드"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border ${
                addMode === 'image'
                    ? `${classes.primary} text-white dark:text-[#1a1a1a]`
                    : `${classes.bgSurface} ${classes.textBody} ${classes.border} hover:bg-[var(--color-surface-hover)]`
              }`}
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
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            <Tooltip content="텍스트 추가" position="bottom">
              <button
                onClick={() => onAddModeChange(addMode === 'text' ? null : 'text')}
                aria-label="텍스트 추가"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border ${
                  addMode === 'text'
                    ? `${classes.primary} text-white dark:text-[#1a1a1a]`
                    : `${classes.bgSurface} ${classes.textBody} ${classes.border} hover:bg-[var(--color-surface-hover)]`
                }`}
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
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
                텍스트
              </button>
            </Tooltip>
          </div>

          <Tooltip
            content="비공개 보드는 초대할 수 없습니다"
            disabled={isPublic}
            position="bottom"
          >
            <Button 
              variant="secondary" 
              className="text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 익명 사용자 체크
                if (isAnonymous && onEditBlocked) {
                  onEditBlocked();
                  return;
                }
                setIsInviteModalOpen(true);
              }}
              disabled={!isPublic}
            >
              초대
            </Button>
          </Tooltip>
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
        inviteLink={isPublic ? inviteLink : ''}
        boardName={boardName}
        isPublic={isPublic}
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

