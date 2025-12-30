'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Board } from '@entities/board';
import { formatDate, logger } from '@shared/lib';
import { toggleBoardStar, toggleBoardPin, deleteBoard } from '@features/board/api';
import { useAuth } from '@features/auth';
import { ConfirmDialog } from '@shared/ui';

interface BoardCardProps {
  board: Board;
  onUpdate?: () => void;
}

export const BoardCard = ({ board, onUpdate }: BoardCardProps) => {
  const { user } = useAuth();
  const [isTogglingStar, setIsTogglingStar] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 현재 사용자가 보드 소유자인지 확인
  const isOwner = user?.id === board.ownerId;

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isTogglingStar) return;

    setIsTogglingStar(true);
    try {
      await toggleBoardStar(board.id, user.id);
      onUpdate?.();
    } catch (error) {
      logger.error('Failed to toggle star:', error);
    } finally {
      setIsTogglingStar(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isTogglingPin) return;

    setIsTogglingPin(true);
    try {
      await toggleBoardPin(board.id, user.id);
      onUpdate?.();
    } catch (error) {
      logger.error('Failed to toggle pin:', error);
    } finally {
      setIsTogglingPin(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteBoard(board.id);
      onUpdate?.();
      setShowDeleteConfirm(false);
    } catch (error) {
      logger.error('Failed to delete board:', error);
      alert('보드 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // 생성자 표시: 현재 사용자면 "나", 아니면 ownerName 또는 이메일
  const displayOwnerName = board.ownerId === user?.id 
    ? '나' 
    : board.ownerName || '알 수 없음';

  return (
    <div className="group relative">
      <Link
        href={`/board/${board.id}`}
        className="block"
      >
        <div className="bg-[var(--color-surface-default)] rounded-xl border border-[var(--color-border-default)] shadow-sm hover:shadow-xl transition-all duration-300 p-6 h-full flex flex-col hover:-translate-y-1 hover:border-[var(--color-border-focus)]/50">
          {/* Card Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-main)] dark:bg-[var(--color-accent-lime-main)] flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                {/* Pin 아이콘 */}
                {board.isPinned && (
                  <div className="w-5 h-5 text-[var(--color-primary-main)] dark:text-[var(--color-accent-lime-main)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Star 아이콘 */}
                {board.isStarred && (
                  <div className="w-5 h-5 text-[var(--color-warning)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                )}
                {/* 공개/비공개 배지 */}
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    board.isPublic
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] dark:bg-[var(--color-success)]/30'
                      : 'bg-[var(--color-surface-subtle)] dark:bg-[var(--color-surface-elevated)] text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {board.isPublic ? '공개' : '비공개'}
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-strong)] mb-1 group-hover:text-[var(--color-primary-main)] dark:group-hover:text-[var(--color-accent-lime-main)] transition-colors line-clamp-2 leading-tight">
              {board.name}
            </h3>
            {/* 보드 설명 */}
            {board.description && (
              <p className="text-sm text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                {board.description}
              </p>
            )}
          </div>

          {/* Card Footer */}
          <div className="mt-auto space-y-2.5 pt-4 border-t border-[var(--color-border-default)]">
            {/* 생성자 */}
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)]">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{displayOwnerName}</span>
            </div>

            {/* 요소 개수 */}
            {board.elementCount !== undefined && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-main)] dark:bg-[var(--color-accent-lime-main)]"></div>
                <span className="font-medium">{board.elementCount}개 요소</span>
              </div>
            )}

            {/* 나의 최근 활동 */}
            {board.myLastActivityAt && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>내 활동: {formatDate(board.myLastActivityAt)}</span>
              </div>
            )}

            {/* 생성 날짜 */}
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>생성: {formatDate(board.createdAt)}</span>
            </div>

            {/* 최근 업데이트 */}
            {board.updatedAt !== board.createdAt && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>수정: {formatDate(board.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* 즐겨찾기/고정/삭제 버튼 (호버 시 표시) */}
      {user && (
        <div className="absolute top-20 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 즐겨찾기 버튼 */}
          <button
            onClick={handleToggleStar}
            disabled={isTogglingStar}
            className={`p-1.5 rounded-md transition-all ${
              board.isStarred
                ? 'text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-warning)]'
            } ${isTogglingStar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={board.isStarred ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <svg
              className="w-4 h-4"
              fill={board.isStarred ? 'currentColor' : 'none'}
              stroke={board.isStarred ? 'none' : 'currentColor'}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>

          {/* 고정 버튼 */}
          <button
            onClick={handleTogglePin}
            disabled={isTogglingPin}
            className={`p-1.5 rounded-md transition-all ${
              board.isPinned
                ? 'text-[var(--color-primary-main)] dark:text-[var(--color-accent-lime-main)] hover:bg-[var(--color-primary-tint)] dark:hover:bg-[var(--color-accent-lime-tint)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-main)] dark:hover:text-[var(--color-accent-lime-main)]'
            } ${isTogglingPin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={board.isPinned ? '고정 해제' : '고정하기'}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
            </svg>
          </button>

          {/* 삭제 버튼 (소유자만) */}
          {isOwner && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={`p-1.5 rounded-md transition-all text-[var(--color-text-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="보드 삭제"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="보드 삭제"
        message={`"${board.name}" 보드를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
