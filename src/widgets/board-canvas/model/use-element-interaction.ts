'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { BoardElement, TextStyle } from '@entities/element';

interface UseElementInteractionProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  scale: number;
  offsetRef: RefObject<{ x: number; y: number }>;
  elements: BoardElement[];
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementZIndexChange?: (elementId: string, zIndex: number) => void;
  onElementDelete: (elementId: string) => void;
  editingElement: string | null;
  setEditingElement: (elementId: string | null) => void;
  setEditContent: (content: string) => void;
  selectedElement: string | null;
  setSelectedElement: (elementId: string | null) => void;
}

export const useElementInteraction = ({
  canvasRef,
  scale,
  offsetRef,
  elements,
  onElementMove,
  onElementResize,
  onElementZIndexChange,
  onElementDelete,
  editingElement,
  setEditingElement,
  setEditContent,
  selectedElement,
  setSelectedElement,
}: UseElementInteractionProps) => {
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const draggedElementRef = useRef<string | null>(null);
  const [elementDragStart, setElementDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const resizingElementRef = useRef<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastElementPositionRef = useRef<{ elementId: string; position: { x: number; y: number } } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    elementId: string | null;
    elementType: 'note' | 'image' | 'text' | null;
  }>({
    isOpen: false,
    elementId: null,
    elementType: null,
  });

  // draggedElement와 resizingElement를 ref로 동기화
  useEffect(() => {
    draggedElementRef.current = draggedElement;
  }, [draggedElement]);

  useEffect(() => {
    resizingElementRef.current = resizingElement;
  }, [resizingElement]);

  // z-index 변경 핸들러
  const handleBringForward = useCallback((elementId: string) => {
    if (!onElementZIndexChange) return;
    
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    // 같은 zIndex를 가진 요소들 중 가장 높은 값 찾기
    const maxZIndex = Math.max(...elements.map((el) => el.zIndex ?? 0));
    
    // 최대값보다 1 크게 설정
    onElementZIndexChange(elementId, maxZIndex + 1);
  }, [elements, onElementZIndexChange]);

  const handleSendBackward = useCallback((elementId: string) => {
    if (!onElementZIndexChange) return;
    
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    // 같은 zIndex를 가진 요소들 중 가장 낮은 값 찾기
    const minZIndex = Math.min(...elements.map((el) => el.zIndex ?? 0));
    
    // 최소값보다 1 작게 설정
    onElementZIndexChange(elementId, minZIndex - 1);
  }, [elements, onElementZIndexChange]);

  // 키보드 단축키 (Ctrl+] / Ctrl+[)
  useEffect(() => {
    if (!selectedElement || !onElementZIndexChange) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && selectedElement) {
        if (e.key === ']') {
          e.preventDefault();
          handleBringForward(selectedElement);
        } else if (e.key === '[') {
          e.preventDefault();
          handleSendBackward(selectedElement);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, onElementZIndexChange, handleBringForward, handleSendBackward]);

  // 요소 드래그 시작 핸들러 (공통 로직)
  const handleElementDragStart = useCallback((e: React.MouseEvent, elementId: string, elementPosition: { x: number; y: number }) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && offsetRef.current) {
      const mouseX = (e.clientX - rect.left - offsetRef.current.x) / scale;
      const mouseY = (e.clientY - rect.top - offsetRef.current.y) / scale;
      setElementDragStart({
        x: mouseX - elementPosition.x,
        y: mouseY - elementPosition.y,
      });
      setDraggedElement(elementId);
      lastElementPositionRef.current = null;
    }
  }, [scale, canvasRef, offsetRef]);

  // 리사이즈 핸들 시작 핸들러 (공통 로직)
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, elementSize: { width: number; height: number }) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && offsetRef.current) {
      setResizeStart({
        x: (e.clientX - rect.left - offsetRef.current.x) / scale,
        y: (e.clientY - rect.top - offsetRef.current.y) / scale,
        width: elementSize.width,
        height: elementSize.height,
      });
      setResizingElement(elementId);
    }
  }, [scale, canvasRef, offsetRef]);

  // 요소 선택 핸들러 (공통 로직)
  const handleElementSelect = useCallback((elementId: string) => {
    // 이전 편집 중인 요소가 있고 다른 요소를 선택하면 편집 종료
    if (editingElement && editingElement !== elementId) {
      setEditingElement(null);
      setEditContent('');
    }
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    } else {
      setSelectedElement(elementId);
    }
  }, [selectedElement, editingElement, setEditingElement, setEditContent]);

  // 요소 드래그/리사이즈를 위한 마우스 이동 핸들러
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 협업 위젯 위에서는 캔버스 마우스 이벤트 무시 (위젯 드래그와 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.closest('[data-collaboration-widget]')) {
      return;
    }
    
    // 패닝은 window 레벨 이벤트로 처리하므로 여기서는 요소 드래그와 리사이즈만 처리
    if (draggedElement && elementDragStart && offsetRef.current) {
      // 요소 드래그
      // offsetRef를 사용하여 드래그 중 실시간 위치 반영
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - offsetRef.current.x) / scale;
        const mouseY = (e.clientY - rect.top - offsetRef.current.y) / scale;
        const newX = mouseX - elementDragStart.x;
        const newY = mouseY - elementDragStart.y;
        const newPosition = { x: newX, y: newY };
        lastElementPositionRef.current = { elementId: draggedElement, position: newPosition };
        onElementMove(draggedElement, newPosition, true); // 드래그 중
      }
    } else if (resizingElement && resizeStart && offsetRef.current) {
      // 요소 리사이즈
      // offsetRef를 사용하여 드래그 중 실시간 위치 반영
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - offsetRef.current.x) / scale;
        const mouseY = (e.clientY - rect.top - offsetRef.current.y) / scale;
        const deltaX = mouseX - resizeStart.x;
        const deltaY = mouseY - resizeStart.y;
        const newWidth = Math.max(100, resizeStart.width + deltaX);
        const newHeight = Math.max(80, resizeStart.height + deltaY);
        onElementResize(resizingElement, { width: newWidth, height: newHeight });
      }
    }
  }, [scale, draggedElement, elementDragStart, resizingElement, resizeStart, onElementMove, onElementResize, canvasRef, offsetRef]);

  // 요소 드래그/리사이즈 종료 핸들러
  const handleMouseUp = useCallback(() => {
    // 요소 드래그 종료 시 최종 위치 저장
    if (draggedElement && lastElementPositionRef.current && lastElementPositionRef.current.elementId === draggedElement) {
      // 드래그 종료 시 마지막 위치 저장 (isDragging: false)
      onElementMove(draggedElement, lastElementPositionRef.current.position, false);
      lastElementPositionRef.current = null;
    }
    
    // 요소 드래그/리사이즈 종료
    // 상태를 즉시 초기화하여 window 이벤트 리스너가 정리되도록 함
    setDraggedElement(null);
    setElementDragStart(null);
    setResizingElement(null);
    setResizeStart(null);
  }, [draggedElement, onElementMove]);

  // Delete 키로 요소 삭제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete 키로 삭제 (Backspace는 제거)
      if (e.key === 'Delete') {
        // 편집 모드일 때 (포스트잇, 텍스트)
        if (editingElement) {
          const element = elements.find((el) => el.id === editingElement);
          if (element?.type === 'note' || element?.type === 'text') {
            e.preventDefault();
            setDeleteConfirm({
              isOpen: true,
              elementId: editingElement,
              elementType: element.type,
            });
          }
          return;
        }
        
        // 선택된 요소가 있을 때 (포스트잇, 이미지 모두)
        if (selectedElement) {
          e.preventDefault();
          const element = elements.find((el) => el.id === selectedElement);
          if (element) {
            setDeleteConfirm({
              isOpen: true,
              elementId: selectedElement,
              elementType: element.type,
            });
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingElement, selectedElement, elements]);

  // 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm.elementId || !deleteConfirm.elementType) return;

    const elementIdToDelete = deleteConfirm.elementId;

    // 편집 모드였다면 편집 모드 해제
    if (editingElement === elementIdToDelete) {
      setEditingElement(null);
      setEditContent('');
    }

    // 선택 상태였다면 선택 해제
    if (selectedElement === elementIdToDelete) {
      setSelectedElement(null);
    }

    // 삭제 실행
    onElementDelete(elementIdToDelete);

    // 다이얼로그 닫기
    setDeleteConfirm({
      isOpen: false,
      elementId: null,
      elementType: null,
    });
  }, [deleteConfirm.elementId, deleteConfirm.elementType, editingElement, selectedElement, onElementDelete, setEditingElement, setEditContent]);

  // 삭제 취소 핸들러
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({
      isOpen: false,
      elementId: null,
      elementType: null,
    });
  }, []);

  // 삭제 확인 메시지 생성
  const getDeleteMessage = useCallback(() => {
    if (deleteConfirm.elementType === 'note') {
      return '정말 이 포스트잇을 삭제하시겠습니까?';
    } else if (deleteConfirm.elementType === 'image') {
      return '정말 이 이미지를 삭제하시겠습니까?';
    } else if (deleteConfirm.elementType === 'text') {
      return '정말 이 텍스트를 삭제하시겠습니까?';
    }
    return '정말 이 요소를 삭제하시겠습니까?';
  }, [deleteConfirm.elementType]);

  // 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = useCallback((elementId: string, elementType: 'note' | 'image' | 'text') => {
    setDeleteConfirm({
      isOpen: true,
      elementId,
      elementType,
    });
  }, []);

  return {
    draggedElement,
    resizingElement,
    selectedElement,
    setSelectedElement,
    draggedElementRef,
    resizingElementRef,
    deleteConfirm,
    handleElementDragStart,
    handleResizeStart,
    handleElementSelect,
    handleMouseMove,
    handleMouseUp,
    handleBringForward,
    handleSendBackward,
    openDeleteConfirm,
    handleDeleteConfirm,
    handleDeleteCancel,
    getDeleteMessage,
  };
};

