'use client';

import { useMemo, useCallback } from 'react';
import type { TextStyle } from '@entities/element';

/**
 * 편집 권한 체크를 포함한 핸들러 래퍼 훅
 * 
 * 모든 요소 조작 핸들러에 편집 권한 체크를 자동으로 추가합니다.
 * 익명 사용자나 권한이 없는 경우 핸들러를 실행하지 않습니다.
 */
interface UseEditGuardedHandlersProps {
  handlers: {
    onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
    onElementResize: (elementId: string, size: { width: number; height: number }) => void;
    onElementUpdate: (elementId: string, content: string) => void;
    onElementColorChange: (elementId: string, color: string) => void;
    onElementStyleChange?: (elementId: string, style: TextStyle) => void;
    onElementZIndexChange?: (elementId: string, zIndex: number) => void;
    onElementDelete: (elementId: string) => void;
    onAddNote: (position: { x: number; y: number }) => void;
    onAddImage: (position: { x: number; y: number }, file?: File) => void;
    onAddText?: (position: { x: number; y: number }) => void;
  };
  checkCanEdit: () => boolean;
  onPermissionDenied?: () => void;
}

interface UseEditGuardedHandlersReturn {
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementUpdate: (elementId: string, content: string) => void;
  onElementColorChange: (elementId: string, color: string) => void;
  onElementStyleChange?: (elementId: string, style: TextStyle) => void;
  onElementZIndexChange?: (elementId: string, zIndex: number) => void;
  onElementDelete: (elementId: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onAddImage: (position: { x: number; y: number }, file?: File) => void;
  onAddText?: (position: { x: number; y: number }) => void;
}

export const useEditGuardedHandlers = ({
  handlers,
  checkCanEdit,
  onPermissionDenied,
}: UseEditGuardedHandlersProps): UseEditGuardedHandlersReturn => {
  const guardedHandlers = useMemo(() => {
    const guard = <Args extends unknown[], Return>(
      fn: (...args: Args) => Return
    ): ((...args: Args) => Return | undefined) => {
      return ((...args: Args) => {
        if (!checkCanEdit()) {
          onPermissionDenied?.();
          return undefined;
        }
        return fn(...args);
      });
    };

    return {
      onElementMove: guard(handlers.onElementMove),
      onElementResize: guard(handlers.onElementResize),
      onElementUpdate: guard(handlers.onElementUpdate),
      onElementColorChange: guard(handlers.onElementColorChange),
      onElementStyleChange: handlers.onElementStyleChange ? guard(handlers.onElementStyleChange) : undefined,
      onElementZIndexChange: handlers.onElementZIndexChange ? guard(handlers.onElementZIndexChange) : undefined,
      onElementDelete: guard(handlers.onElementDelete),
      onAddNote: guard(handlers.onAddNote),
      onAddImage: guard(handlers.onAddImage),
      onAddText: handlers.onAddText ? guard(handlers.onAddText) : undefined,
    };
  }, [handlers, checkCanEdit, onPermissionDenied]);

  return guardedHandlers;
};

