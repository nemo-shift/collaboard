'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@shared/lib';

interface UseEditableFieldOptions {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  onCancel?: () => void;
  enabled?: boolean;
}

interface UseEditableFieldReturn {
  isEditing: boolean;
  editedValue: string;
  isSaving: boolean;
  setIsEditing: (editing: boolean) => void;
  setEditedValue: (value: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

/**
 * 편집 가능한 필드를 위한 재사용 가능한 훅
 * 보드 이름, 설명 등 인라인 편집에 사용
 */
export const useEditableField = ({
  initialValue,
  onSave,
  onCancel,
  enabled = true,
}: UseEditableFieldOptions): UseEditableFieldReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // initialValue 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setEditedValue(initialValue);
  }, [initialValue]);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (!enabled || !onSave) return;

    const trimmedValue = editedValue.trim();
    
    // 빈 값이면 초기값으로 복원하고 편집 모드 종료
    if (!trimmedValue) {
      setEditedValue(initialValue);
      setIsEditing(false);
      return;
    }

    // 값이 변경되지 않았으면 편집 모드만 종료
    if (trimmedValue === initialValue.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      logger.error('Failed to save:', error);
      setEditedValue(initialValue); // 롤백
    } finally {
      setIsSaving(false);
    }
  }, [editedValue, initialValue, onSave, enabled]);

  const handleCancel = useCallback(() => {
    setEditedValue(initialValue);
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  }, [initialValue, onCancel]);

  return {
    isEditing,
    editedValue,
    isSaving,
    setIsEditing,
    setEditedValue,
    handleSave,
    handleCancel,
    inputRef,
  };
};

