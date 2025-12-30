'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import type { BoardElement } from '@entities/element';
import { ColorPicker } from '@shared/ui';
import { formatUserName, DEFAULT_BACKGROUND_COLOR, useTheme } from '@shared/lib';
import { DEFAULT_NOTE_COLOR } from '@features/content/lib/constants';
import { ResizeHandle } from './resize-handle';
import { ZIndexButtonGroup } from './z-index-buttons';

interface NoteElementProps {
  element: BoardElement;
  isEditing: boolean;
  editContent: string;
  isSelected: boolean;
  isOwner: boolean;
  currentUserId?: string;
  scale: number;
  onEditContentChange: (content: string) => void;
  onEditComplete: () => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * 포스트잇 요소 컴포넌트
 * 편집 모드와 보기 모드를 지원
 */
const NoteElementComponent = ({
  element,
  isEditing,
  editContent,
  isSelected,
  isOwner,
  currentUserId,
  scale,
  onEditContentChange,
  onEditComplete,
  onColorChange,
  onDelete,
  onResizeStart,
  onBringForward,
  onSendBackward,
  textareaRef,
}: NoteElementProps) => {
  const { classes, isDark } = useTheme();

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing, textareaRef]);

  const canDelete = isOwner || element.userId === currentUserId;

  // 다크모드에서 포스트잇 색상과 텍스트 색상 계산 (useMemo로 최적화)
  const { adjustedColor, textColor } = useMemo(() => {
    const backgroundColor = element.color || DEFAULT_BACKGROUND_COLOR;
    
    // 다크모드에서 포스트잇 색상을 어둡게 조정
    const adjusted = isDark ? (() => {
      // hex를 rgb로 변환
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      
      // 밝기를 60%로 감소 (더 어둡게)
      const darkenFactor = 0.6;
      const newR = Math.floor(r * darkenFactor);
      const newG = Math.floor(g * darkenFactor);
      const newB = Math.floor(b * darkenFactor);
      
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    })() : backgroundColor;
    
    // 다크모드에서 텍스트 색상 결정 (통일된 색상 사용)
    const text = isDark ? '#f4f4f4' : undefined;
    
    return { adjustedColor: adjusted, textColor: text };
  }, [element.color, isDark]);

  return (
    <div
      className={`w-full h-full rounded-lg shadow-sm p-3 hover:shadow-md transition-all relative ${
        isSelected && !isEditing
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
          : classes.border
      }`}
      style={{ backgroundColor: adjustedColor }}
    >
      {isEditing ? (
        <div className="h-full flex flex-col relative" onClick={(e) => e.stopPropagation()}>
          {/* 삭제 버튼과 색상 선택기 */}
          <div className="mb-2 flex items-center justify-between z-10 relative">
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-6 h-6 flex items-center justify-center rounded transition-colors z-20 relative outline-none focus:outline-none"
              >
                <svg
                  className={`w-4 h-4 hover:text-red-500 transition-colors ${!isDark ? classes.text : ''}`}
                  style={textColor ? { color: textColor } : undefined}
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

            <ColorPicker
              selectedColor={element.color || DEFAULT_NOTE_COLOR}
              onColorSelect={(color) => {
                onColorChange(color);
                // 색상 선택 후에도 편집 모드 유지
                if (textareaRef.current) {
                  setTimeout(() => {
                    textareaRef.current?.focus();
                  }, 0);
                }
              }}
            />
          </div>

          {/* 텍스트 입력 영역 */}
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            onBlur={(e) => {
              // 색상 선택 버튼이나 팔레트를 클릭한 경우 blur 방지
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget && (
                relatedTarget.closest('[data-color-picker]') ||
                relatedTarget.closest('.color-picker-popup')
              )) {
                return;
              }
              // 포커스가 색상 선택 관련 요소로 이동한 경우 방지
              const activeElement = document.activeElement;
              if (activeElement && (
                activeElement.closest('[data-color-picker]') ||
                activeElement.closest('.color-picker-popup')
              )) {
                return;
              }
              onEditComplete();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onEditComplete();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={`flex-1 text-sm resize-none outline-none border-none bg-transparent ${!isDark ? classes.text : ''}`}
            style={{ 
              minHeight: '60px',
              ...(textColor && { color: textColor })
            }}
            placeholder="텍스트를 입력하세요..."
          />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* 텍스트 영역 */}
          <div 
            className={`text-sm whitespace-pre-wrap break-words flex-1 min-h-[60px] overflow-y-auto note-scrollbar ${!isDark ? classes.text : ''}`}
            style={textColor ? { color: textColor } : undefined}
          >
            {element.content || '더블클릭하여 편집'}
          </div>
          {/* 작성자 표시 */}
          <div className={`mt-2 pt-2 border-t ${classes.border} flex-shrink-0`}>
            <div className="flex items-center gap-1.5">
              <div 
                className="w-1.5 h-1.5 rounded-full"
                style={undefined}
              />
              <span 
                className={`text-xs ${classes.textMuted}`}
                style={textColor ? { color: textColor } : undefined}
              >
                {formatUserName(element.userName)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* z-index 변경 버튼 (선택된 상태일 때만 표시) */}
      {isSelected && !isEditing && (onBringForward || onSendBackward) && (
        <ZIndexButtonGroup
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
        />
      )}

      {/* 더블클릭하여 편집 힌트 (내용이 있고 선택된 상태일 때만 표시) */}
      {isSelected && !isEditing && element.content && element.content.trim() !== '' && (
        <div className="absolute right-2 z-40" style={{ bottom: 'calc(3rem + 4px)' }}>
          <span
            className={`text-xs px-2 py-1 rounded ${classes.bg} ${classes.textMuted} backdrop-blur-sm bg-opacity-80 shadow-sm`}
            style={textColor ? { color: textColor } : undefined}
          >
            더블클릭하여 편집
          </span>
        </div>
      )}

      {/* 리사이즈 핸들 */}
      {!isEditing && (
        <ResizeHandle onMouseDown={onResizeStart} />
      )}
    </div>
  );
};

export const NoteElement = React.memo(NoteElementComponent, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 불필요한 리렌더링 방지
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.element.content === nextProps.element.content &&
    prevProps.element.position.x === nextProps.element.position.x &&
    prevProps.element.position.y === nextProps.element.position.y &&
    prevProps.element.size.width === nextProps.element.size.width &&
    prevProps.element.size.height === nextProps.element.size.height &&
    prevProps.element.color === nextProps.element.color &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editContent === nextProps.editContent &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.scale === nextProps.scale
  );
});

