'use client';

import { useEffect, useRef } from 'react';
import { Button } from './button';
import { useTheme } from '@shared/lib';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title = '확인',
  message,
  confirmText = '삭제',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { classes } = useTheme();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // 모달이 열릴 때 삭제 버튼에 자동 포커스
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // 약간의 지연을 두어 모달이 완전히 렌더링된 후 포커스
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 키보드 이벤트 처리
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${classes.bgSurface} rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 ${classes.border}`}>
        <h3 className={`text-xl font-semibold mb-4 ${classes.text}`}>{title}</h3>
        <p className={`mb-6 leading-relaxed ${classes.textBody}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          {cancelText && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2.5"
            >
              {cancelText}
            </Button>
          )}
          <Button
            ref={confirmButtonRef}
            variant="primary"
            onClick={onConfirm}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white outline-none focus:outline-none"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

