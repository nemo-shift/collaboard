'use client';

import React, { useState } from 'react';
import type { BoardElement } from '@entities/element';
import { ResizeHandle } from './resize-handle';
import { ZIndexButtonGroup } from './z-index-buttons';
import { formatUserName, useTheme } from '@shared/lib';

interface ImageElementProps {
  element: BoardElement;
  isSelected: boolean;
  isOwner: boolean;
  currentUserId?: string;
  onDelete: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
}

/**
 * 이미지 요소 컴포넌트
 * 이미지 표시 및 삭제 기능 제공
 */
const ImageElementComponent = ({
  element,
  isSelected,
  isOwner,
  currentUserId,
  onDelete,
  onResizeStart,
  onBringForward,
  onSendBackward,
}: ImageElementProps) => {
  const [hasError, setHasError] = useState(false);
  const { classes } = useTheme();

  const canDelete = isOwner || element.userId === currentUserId;

  return (
    <div
      className={`w-full h-full rounded-lg overflow-hidden relative bg-[var(--color-surface-default)] group transition-all ${
        isSelected
          ? 'ring-2 ring-[var(--color-primary-main)] dark:ring-[var(--color-accent-lime-main)] ring-offset-2 shadow-lg'
          : 'border border-[var(--color-border-default)]'
      }`}
    >
      {/* z-index 변경 버튼 (선택된 상태일 때만 표시) - 이미지 요소는 우측 하단에 배치, 리사이즈 핸들과 겹치지 않도록 조정 */}
      {isSelected && (onBringForward || onSendBackward) && (
        <div className="absolute z-50" style={{ bottom: '0.3rem', right: '0.3rem' }}>
          <ZIndexButtonGroup
            onBringForward={onBringForward}
            onSendBackward={onSendBackward}
            position="bottom-right"
          />
        </div>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-colors z-50 opacity-0 group-hover:opacity-100 outline-none focus:outline-none"
        >
          <svg
            className="w-4 h-4 text-[var(--color-text-strong)] hover:text-[var(--color-error)] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}

      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-subtle)] dark:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2"
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
            <p className="text-xs">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      ) : (
        <img
          src={element.content}
          alt={element.userName ? `${formatUserName(element.userName)}이(가) 업로드한 이미지` : '업로드된 이미지'}
          className="w-full h-full object-contain"
          draggable={false}
          onError={() => setHasError(true)}
        />
      )}

      {/* 업로드한 사람 표시 (왼쪽 하단, 마우스 오버 시 표시) */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-40">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--color-text-strong)', opacity: 0.6 }}
        />
        <span
          className={`text-xs px-2 py-0.5 rounded ${classes.bg} ${classes.textMuted} backdrop-blur-sm bg-opacity-80`}
        >
          {formatUserName(element.userName)}
        </span>
      </div>

      {/* 리사이즈 핸들 */}
      <ResizeHandle onMouseDown={onResizeStart} />
    </div>
  );
};

export const ImageElement = React.memo(ImageElementComponent, (prevProps, nextProps) => {
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.element.content === nextProps.element.content &&
    prevProps.element.position.x === nextProps.element.position.x &&
    prevProps.element.position.y === nextProps.element.position.y &&
    prevProps.element.size.width === nextProps.element.size.width &&
    prevProps.element.size.height === nextProps.element.size.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

