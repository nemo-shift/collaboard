'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BoardElement } from '@entities/element';

interface UseElementEditingProps {
  elements: BoardElement[];
  canEdit: boolean;
  onEditBlocked?: () => void;
  onElementUpdate: (elementId: string, content: string) => void;
  selectedElement: string | null;
  setSelectedElement: (elementId: string | null) => void;
}

export const useElementEditing = ({
  elements,
  canEdit,
  onEditBlocked,
  onElementUpdate,
}: UseElementEditingProps) => {
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // 더블클릭으로 포스트잇 편집 시작
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 편집 권한 체크
    if (!canEdit) {
      if (onEditBlocked) {
        onEditBlocked();
      }
      return;
    }
    
    const target = e.target as HTMLElement;
    const elementContainer = target.closest('[data-element-id]');
    if (elementContainer) {
      const elementId = elementContainer.getAttribute('data-element-id');
      if (elementId) {
        const element = elements.find((el) => el.id === elementId);
        if (element && (element.type === 'note' || element.type === 'text')) {
          setEditingElement(elementId);
          setEditContent(element.content);
        }
        // 이미지는 더블클릭 편집 모드 없음
      }
    }
  }, [elements, canEdit, onEditBlocked]);

  // 편집 완료
  const handleEditComplete = useCallback(() => {
    if (editingElement) {
      onElementUpdate(editingElement, editContent);
      setEditingElement(null);
      setEditContent('');
    }
  }, [editingElement, editContent, onElementUpdate]);

  // ESC로 편집 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC로 편집 취소 (편집 모드일 때만)
      if (e.key === 'Escape' && editingElement) {
        const element = elements.find((el) => el.id === editingElement);
        if (element?.type === 'note' || element?.type === 'text') {
          setEditingElement(null);
          setEditContent('');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingElement, elements]);

  // 편집 중일 때 textarea 포커스
  useEffect(() => {
    if (editingElement && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingElement]);

  // 빈 공간 클릭 시 편집 모드 종료 및 내용 저장
  const handleCanvasClick = useCallback((e: React.MouseEvent, canvasRef: React.RefObject<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // 빈 공간 클릭 시 편집 모드 종료 (요소가 아닌 곳 클릭)
    if (
      target === canvasRef.current ||
      target.closest('.grid-background') ||
      (!target.closest('[data-element-id]') && !target.closest('button') && !target.closest('[data-color-picker]') && !target.closest('.color-picker-popup') && !target.closest('[data-text-toolbar]'))
    ) {
      // 편집 모드 종료 - 내용 저장 후 종료
      if (editingElement) {
        const element = elements.find((el) => el.id === editingElement);
        if (element) {
          let currentContent = editContent;
          
          // 현재 편집 중인 내용을 DOM에서 직접 읽기
          if (element.type === 'text' && contentEditableRef.current) {
            // 텍스트 요소: contentEditable에서 내용 읽기
            currentContent = contentEditableRef.current.innerHTML || '';
          } else if (element.type === 'note' && textareaRef.current) {
            // 포스트잇: textarea에서 내용 읽기
            currentContent = textareaRef.current.value || '';
          }
          
          // 내용 저장
          onElementUpdate(editingElement, currentContent);
          setEditingElement(null);
          setEditContent('');
        }
      }
    }
  }, [editingElement, editContent, elements, onElementUpdate]);

  return {
    editingElement,
    editContent,
    setEditContent,
    setEditingElement,
    textareaRef,
    contentEditableRef,
    handleDoubleClick,
    handleEditComplete,
    handleCanvasClick,
  };
};

