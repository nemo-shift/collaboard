'use client';

import { useMemo, useCallback } from 'react';

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
    onElementDelete: (elementId: string) => void;
    onAddNote: (position: { x: number; y: number }) => void;
    onAddImage: (position: { x: number; y: number }, file?: File) => void;
  };
  checkCanEdit: () => boolean;
  onPermissionDenied?: () => void;
}

interface UseEditGuardedHandlersReturn {
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementUpdate: (elementId: string, content: string) => void;
  onElementColorChange: (elementId: string, color: string) => void;
  onElementDelete: (elementId: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onAddImage: (position: { x: number; y: number }, file?: File) => void;
}

export const useEditGuardedHandlers = ({
  handlers,
  checkCanEdit,
  onPermissionDenied,
}: UseEditGuardedHandlersProps): UseEditGuardedHandlersReturn => {
  const guardedHandlers = useMemo(() => {
    const guard = <T extends (...args: any[]) => any>(fn: T): T => {
      return ((...args: any[]) => {
        if (!checkCanEdit()) {
          onPermissionDenied?.();
          return;
        }
        return fn(...args);
      }) as T;
    };

    return {
      onElementMove: guard(handlers.onElementMove),
      onElementResize: guard(handlers.onElementResize),
      onElementUpdate: guard(handlers.onElementUpdate),
      onElementColorChange: guard(handlers.onElementColorChange),
      onElementDelete: guard(handlers.onElementDelete),
      onAddNote: guard(handlers.onAddNote),
      onAddImage: guard(handlers.onAddImage),
    };
  }, [handlers, checkCanEdit, onPermissionDenied]);

  return guardedHandlers;
};

