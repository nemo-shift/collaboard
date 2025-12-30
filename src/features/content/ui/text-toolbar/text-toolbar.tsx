'use client';

import { memo, useRef, useCallback } from 'react';
import type { TextStyle } from '@entities/element';
import { useTheme } from '@shared/lib';
import { Tooltip } from '@shared/ui';
import { useTextToolbar } from './use-text-toolbar';

interface TextToolbarProps {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  textStyle: TextStyle;
  onStyleChange: (style: TextStyle) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  showToolbar: boolean;
}

/**
 * 텍스트 편집 툴바 컴포넌트
 * React.memo로 최적화하여 불필요한 리렌더링 방지
 */
export const TextToolbar = memo<TextToolbarProps>(({
  contentEditableRef,
  isEditing,
  textStyle,
  onStyleChange,
  onDelete,
  canDelete = false,
  showToolbar,
}) => {
  const { classes } = useTheme();
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const {
    toolbarState,
    execCommand,
  } = useTextToolbar({
    contentEditableRef,
    isEditing,
    textStyle,
    onStyleChange,
  });

  const handleButtonClick = useCallback((command: string) => {
    execCommand(command);
    contentEditableRef.current?.focus();
  }, [execCommand]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      ref={toolbarRef}
      data-text-toolbar
      className={`absolute left-0 flex items-center gap-1 p-2 ${classes.bgSurface} border ${classes.border} rounded-lg shadow-lg z-50`}
      style={{ 
        display: showToolbar || isEditing ? 'flex' : 'none',
        top: '-72px',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 볼드 */}
      <Tooltip content="굵게 (Ctrl+B)" position="bottom">
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            handleMouseDown(e);
            handleButtonClick('bold');
          }}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            toolbarState.bold 
              ? 'bg-[var(--color-primary-main)] dark:bg-[var(--color-accent-lime-main)] text-white dark:text-[#1a1a1a] hover:brightness-110 dark:hover:brightness-110' 
              : `${classes.bgHover} ${classes.textBody} hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm`
          }`}
        >
          <strong>B</strong>
        </button>
      </Tooltip>

      {/* 기울임 */}
      <Tooltip content="기울임 (Ctrl+I)" position="bottom">
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            handleMouseDown(e);
            handleButtonClick('italic');
          }}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            toolbarState.italic 
              ? 'bg-[var(--color-primary-main)] dark:bg-[var(--color-accent-lime-main)] text-white dark:text-[#1a1a1a] hover:brightness-110 dark:hover:brightness-110' 
              : `${classes.bgHover} ${classes.textBody} hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm`
          }`}
        >
          <em>I</em>
        </button>
      </Tooltip>

      {/* 삭제 버튼 */}
      {canDelete && onDelete && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Tooltip content="삭제 (Delete 키)" position="bottom">
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onClick={(e) => {
                handleMouseDown(e);
                e.stopPropagation();
                onDelete();
              }}
              className={`px-2 py-1 rounded text-sm transition-colors ${classes.bgHover} ${classes.textBody} hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 outline-none focus:outline-none`}
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
          </Tooltip>
        </>
      )}
    </div>
  );
});

TextToolbar.displayName = 'TextToolbar';

