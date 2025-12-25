'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BoardElement, CursorPosition } from '@entities/element';
import { ColorPicker, DEFAULT_POSTIT_COLOR, ConfirmDialog } from '@shared/ui';
import { formatUserName, DEFAULT_BACKGROUND_COLOR } from '@shared/lib';
import { DEFAULT_NOTE_COLOR } from '@features/content/lib/constants';

interface BoardCanvasProps {
  boardId: string;
  elements: BoardElement[];
  cursors: CursorPosition[];
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementUpdate: (elementId: string, content: string) => void;
  onElementColorChange: (elementId: string, color: string) => void;
  onElementDelete: (elementId: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onAddImage: (position: { x: number; y: number }) => void;
  addMode?: 'note' | 'image' | null;
  canEdit?: boolean; // 편집 가능 여부 (익명 사용자 + 비공개 보드 체크용)
  onEditBlocked?: () => void; // 편집이 차단되었을 때 호출되는 콜백
  isOwner?: boolean; // 보드 소유자 여부
  currentUserId?: string; // 현재 사용자 ID
}

export const BoardCanvas = ({
  boardId,
  elements,
  cursors,
  onElementMove,
  onElementResize,
  onElementUpdate,
  onElementColorChange,
  onElementDelete,
  onAddNote,
  onAddImage,
  addMode = null,
  canEdit = true,
  onEditBlocked,
  isOwner = false,
  currentUserId,
}: BoardCanvasProps) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 드래그 중 실시간 위치 추적용 ref (리렌더링 없이 업데이트)
  // 리얼타임 협업을 고려: 자신의 패닝은 ref로 관리, 드래그 종료 시에만 상태 업데이트
  const offsetRef = useRef({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [elementDragStart, setElementDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastElementPositionRef = useRef<{ elementId: string; position: { x: number; y: number } } | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    elementId: string | null;
    elementType: 'note' | 'image' | null;
  }>({
    isOpen: false,
    elementId: null,
    elementType: null,
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoomInputValue, setZoomInputValue] = useState('');
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // boardId가 변경될 때 offset과 scale 초기화
  useEffect(() => {
    const initialOffset = { x: 0, y: 0 };
    setOffset(initialOffset);
    offsetRef.current = initialOffset;
    setScale(1);
    
    // DOM도 초기화
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.transform = `translate(0px, 0px)`;
    }
  }, [boardId]);
  
  // offset 상태 변경 시 ref와 DOM 동기화 (리얼타임 업데이트 대응)
  // 다른 사용자의 패닝이 리얼타임으로 업데이트될 때 사용
  useEffect(() => {
    offsetRef.current = offset;
    if (canvasContainerRef.current && !isDragging) {
      // 자신이 드래그 중이 아닐 때만 DOM 업데이트 (다른 사용자의 패닝 반영)
      // scale도 함께 적용
      canvasContainerRef.current.style.transform = 
        `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
    }
    
    // 커서 동기화를 위한 scale과 offset 브로드캐스트
    const event = new CustomEvent('board-canvas-update', {
      detail: { scale, offset },
    });
    window.dispatchEvent(event);
  }, [offset, isDragging, scale]);

  // 마우스 이동 추적 (커서 표시용)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 협업 위젯 위에서는 마우스 위치 업데이트 무시 (위젯 드래그와 충돌 방지)
      const target = e.target as HTMLElement;
      if (target?.closest?.('[data-collaboration-widget]')) {
        return;
      }
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // offsetRef를 사용하여 드래그 중에도 정확한 마우스 위치 추적
        setMousePosition({
          x: (e.clientX - rect.left - offsetRef.current.x) / scale,
          y: (e.clientY - rect.top - offsetRef.current.y) / scale,
        });
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [offset, scale]);

  // 캔버스 드래그 (패닝) - 스페이스바 + 드래그 또는 미들버튼
  // 리얼타임 협업 최적화: 드래그 중에는 직접 DOM 조작, 종료 시에만 상태 업데이트
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 협업 위젯 클릭은 무시 (위젯 드래그와 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.closest('[data-collaboration-widget]')) {
      return;
    }
    
    // 요소가 아닌 빈 공간에서만 패닝 가능
    if (e.target === canvasRef.current || target.closest('.grid-background')) {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsDragging(true);
        // offsetRef를 사용하여 현재 위치 기준으로 드래그 시작
        setDragStart({ 
          x: e.clientX - offsetRef.current.x, 
          y: e.clientY - offsetRef.current.y 
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 협업 위젯 위에서는 캔버스 마우스 이벤트 무시 (위젯 드래그와 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.closest('[data-collaboration-widget]')) {
      return;
    }
    
    if (isDragging && !draggedElement && !resizingElement) {
      // 캔버스 패닝 - 리얼타임 협업 최적화
      // 드래그 중에는 직접 DOM 조작으로 리렌더링 방지 (60fps 보장)
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      
      // ref에만 저장 (리렌더링 없음)
      offsetRef.current = newOffset;
      
      // 직접 DOM 조작 (GPU 가속 활용)
      // scale도 함께 적용하여 완전한 transform 유지
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.transform = 
          `translate(${newOffset.x}px, ${newOffset.y}px) scale(${scale})`;
      }
    } else if (draggedElement && elementDragStart) {
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
    } else if (resizingElement && resizeStart) {
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
  }, [isDragging, dragStart, scale, draggedElement, elementDragStart, resizingElement, resizeStart, onElementMove, onElementResize]); // offset은 ref로 관리하므로 의존성에서 제거

  const handleMouseUp = useCallback(() => {
    // 드래그 종료 시에만 React 상태 업데이트
    // 리얼타임 협업: 자신의 패닝 종료 시 서버에 동기화할 수 있도록 상태 업데이트
    if (isDragging && !draggedElement && !resizingElement) {
      // offsetRef의 최종 값을 상태로 동기화 (드래그 종료 시 1회만 리렌더링)
      setOffset(offsetRef.current);
      // 향후: 여기서 서버에 offset 동기화 (리얼타임 업데이트)
      // onCanvasPanEnd?.(offsetRef.current);
    }
    
    // 요소 드래그 종료 시 최종 위치 저장
    if (draggedElement && lastElementPositionRef.current && lastElementPositionRef.current.elementId === draggedElement) {
      // 드래그 종료 시 마지막 위치 저장 (isDragging: false)
      onElementMove(draggedElement, lastElementPositionRef.current.position, false);
      lastElementPositionRef.current = null;
    }
    
    setIsDragging(false);
    setDraggedElement(null);
    setElementDragStart(null);
    setResizingElement(null);
    setResizeStart(null);
  }, [isDragging, draggedElement, resizingElement, elementDragStart, scale, onElementMove]);

  // 줌 (스크롤로 줌인/줌아웃 제거 - 클릭 버튼과 숫자 입력으로만 제어)
  // const handleWheel = useCallback((e: React.WheelEvent) => {
  //   e.preventDefault();
  //   const delta = e.deltaY > 0 ? 0.9 : 1.1;
  //   setScale((prev) => Math.max(0.25, Math.min(2, prev * delta)));
  // }, []);

  // 클릭으로 포스트잇/이미지 추가 (addMode에 따라)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (addMode && !draggedElement && !resizingElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // offsetRef를 사용하여 드래그 중에도 정확한 위치 계산
        const x = (e.clientX - rect.left - offsetRef.current.x) / scale;
        const y = (e.clientY - rect.top - offsetRef.current.y) / scale;
        
        if (addMode === 'note') {
          onAddNote({ x, y });
        } else if (addMode === 'image') {
          onAddImage({ x, y });
        }
      }
    }
  }, [addMode, scale, onAddNote, onAddImage, draggedElement, resizingElement]); // offset은 ref로 관리하므로 의존성에서 제거

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
        if (element && element.type === 'note') {
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

  // ESC로 편집 취소, Delete 키로 요소 삭제 (Backspace는 제거)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC로 편집 취소 (편집 모드일 때만)
      if (e.key === 'Escape' && editingElement) {
        const element = elements.find((el) => el.id === editingElement);
        if (element?.type === 'note') {
          setEditingElement(null);
          setEditContent('');
        }
        return;
      }
      
      // Delete 키로 삭제 (Backspace는 제거)
      if (e.key === 'Delete') {
        // 편집 모드일 때 (포스트잇만)
        if (editingElement) {
          const element = elements.find((el) => el.id === editingElement);
          if (element?.type === 'note') {
            e.preventDefault();
            setDeleteConfirm({
              isOpen: true,
              elementId: editingElement,
              elementType: 'note',
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

  // 편집 중일 때 textarea 포커스
  useEffect(() => {
    if (editingElement && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingElement]);

  // 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm.elementId || !deleteConfirm.elementType) return;

    const elementIdToDelete = deleteConfirm.elementId;
    const elementType = deleteConfirm.elementType;

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
  }, [deleteConfirm, editingElement, selectedElement, onElementDelete]);

  // 삭제 취소 핸들러
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({
      isOpen: false,
      elementId: null,
      elementType: null,
    });
  }, []);

  // 삭제 확인 메시지 생성
  const getDeleteMessage = () => {
    if (deleteConfirm.elementType === 'note') {
      return '정말 이 포스트잇을 삭제하시겠습니까?';
    } else if (deleteConfirm.elementType === 'image') {
      return '정말 이 이미지를 삭제하시겠습니까?';
    }
    return '정말 이 요소를 삭제하시겠습니까?';
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-gray-50 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      // onWheel={handleWheel} // 스크롤로 줌인/줌아웃 제거
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // 협업 위젯 클릭은 무시 (위젯 드래그와 충돌 방지)
        if (target.closest('[data-collaboration-widget]')) {
          return;
        }
        
        // 빈 공간 클릭 시 선택 해제 (요소가 아닌 곳 클릭)
        if (
          target === canvasRef.current ||
          target.closest('.grid-background') ||
          (!target.closest('[data-element-id]') && !target.closest('button') && !target.closest('[data-color-picker]') && !target.closest('.color-picker-popup'))
        ) {
          setSelectedElement(null);
        }
        // addMode일 때 요소 추가
        handleClick(e);
      }}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: addMode === 'note' ? 'crosshair' : addMode === 'image' ? 'crosshair' : 'grab' }}
    >
      {/* 그리드 배경 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />

      {/* 요소들 - 리얼타임 협업 최적화: transform으로 GPU 가속 */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: isDragging ? 'transform' : 'auto', // 드래그 중 GPU 가속 힌트
        }}
      >
        {elements.map((element) => {
          const isEditing = editingElement === element.id;
          
          return (
            <div
              key={element.id}
              data-element-id={element.id}
              className="absolute cursor-move select-none group"
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: `${element.size.width}px`,
                height: `${element.size.height}px`,
              }}
                      onClick={(e) => {
                        // 삭제 버튼이나 색상 선택기 클릭은 무시
                        const target = e.target as HTMLElement;
                        if (target.closest('button[title="삭제 (Delete 키)"]') || 
                            target.closest('[data-color-picker]') ||
                            target.closest('.color-picker-popup')) {
                          return;
                        }
                        
                        if (!isEditing && !resizingElement) {
                          e.stopPropagation();
                          // 클릭 시 선택/해제 토글 (편집 모드는 더블클릭으로만 진입)
                          if (selectedElement === element.id) {
                            setSelectedElement(null);
                          } else {
                            setSelectedElement(element.id);
                          }
                        }
                      }}
              onMouseDown={(e) => {
                // 리사이즈 핸들 클릭 체크
                const target = e.target as HTMLElement;
                if (target.classList.contains('resize-handle')) {
                  e.stopPropagation();
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    setResizeStart({
                      x: (e.clientX - rect.left - offsetRef.current.x) / scale,
                      y: (e.clientY - rect.top - offsetRef.current.y) / scale,
                      width: element.size.width,
                      height: element.size.height,
                    });
                    setResizingElement(element.id);
                  }
                  return;
                }
                
                // 편집 중이면 드래그 방지
                if (isEditing) {
                  e.stopPropagation();
                  return;
                }
                
                e.stopPropagation();
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  // offsetRef를 사용하여 드래그 중에도 정확한 위치 계산
                  const mouseX = (e.clientX - rect.left - offsetRef.current.x) / scale;
                  const mouseY = (e.clientY - rect.top - offsetRef.current.y) / scale;
                  setElementDragStart({
                    x: mouseX - element.position.x,
                    y: mouseY - element.position.y,
                  });
                  setDraggedElement(element.id);
                  // 드래그 시작 시 마지막 위치 추적 초기화
                  lastElementPositionRef.current = null;
                }
              }}
            >
            {element.type === 'note' ? (
              <div
                className={`w-full h-full rounded-lg shadow-sm p-3 hover:shadow-md transition-all relative ${
                  selectedElement === element.id && !isEditing
                    ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
                    : 'border border-gray-200'
                }`}
                style={{ backgroundColor: element.color || DEFAULT_BACKGROUND_COLOR }}
              >
                {isEditing ? (
                  <div className="h-full flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                    {/* 삭제 버튼과 색상 선택기 - 같은 줄에 배치 */}
                    <div className="mb-2 flex items-center justify-between z-10 relative">
                      {/* 삭제 버튼 - 포스트잇 안쪽 왼쪽 (보드 소유자이거나 요소 소유자인 경우만 표시) */}
                      {(isOwner || element.userId === currentUserId) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm({
                              isOpen: true,
                              elementId: element.id,
                              elementType: 'note',
                            });
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded transition-colors z-20 relative"
                          title="삭제 (Delete 키)"
                        >
                        <svg
                          className="w-4 h-4 text-gray-900 hover:text-red-500 transition-colors"
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
                      
                      {/* 색상 선택기 - 오른쪽 */}
                      <ColorPicker
                        selectedColor={element.color || DEFAULT_NOTE_COLOR}
                        onColorSelect={(color) => {
                          onElementColorChange(element.id, color);
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
                      onChange={(e) => setEditContent(e.target.value)}
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
                        handleEditComplete();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleEditComplete();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-sm text-gray-900 resize-none outline-none border-none bg-transparent"
                      style={{ minHeight: '60px' }}
                      placeholder="텍스트를 입력하세요..."
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* 텍스트 영역 - 스크롤 가능, 생성자 표시 위까지만 */}
                    <div className="text-sm text-gray-900 whitespace-pre-wrap break-words flex-1 min-h-[60px] overflow-y-auto note-scrollbar">
                      {element.content || '더블클릭하여 편집'}
                    </div>
                    {/* 작성자 표시 - 항상 표시 (고정) */}
                    <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatUserName(element.userName)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 리사이즈 핸들 */}
                {!isEditing && (
                  <div
                    className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-200 border border-gray-300 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (rect) {
                        // offsetRef를 사용하여 드래그 중에도 정확한 위치 계산
                        setResizeStart({
                          x: (e.clientX - rect.left - offsetRef.current.x) / scale,
                          y: (e.clientY - rect.top - offsetRef.current.y) / scale,
                          width: element.size.width,
                          height: element.size.height,
                        });
                        setResizingElement(element.id);
                      }
                    }}
                  >
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`w-full h-full rounded-lg overflow-hidden relative bg-white group transition-all ${
                  selectedElement === element.id
                    ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
                    : 'border border-gray-200'
                }`}
              >
                {/* 삭제 버튼 - 마우스 오버 시 표시, 오른쪽 상단 모서리 (이미지 안쪽) (보드 소유자이거나 요소 소유자인 경우만 표시) */}
                {(isOwner || element.userId === currentUserId) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({
                        isOpen: true,
                        elementId: element.id,
                        elementType: 'image',
                      });
                    }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-colors z-50 opacity-0 group-hover:opacity-100"
                    title="삭제 (Delete 키)"
                  >
                  <svg
                    className="w-4 h-4 text-gray-900 hover:text-red-500 transition-colors"
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
                {failedImages.has(element.id) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
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
                    alt="업로드된 이미지"
                    className="w-full h-full object-contain"
                    draggable={false}
                    onError={() => {
                      setFailedImages((prev) => new Set(prev).add(element.id));
                    }}
                  />
                )}
                
                {/* 리사이즈 핸들 */}
                <div
                  className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-200 border border-gray-300 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      // offsetRef를 사용하여 드래그 중에도 정확한 위치 계산
                      setResizeStart({
                        x: (e.clientX - rect.left - offsetRef.current.x) / scale,
                        y: (e.clientY - rect.top - offsetRef.current.y) / scale,
                        width: element.size.width,
                        height: element.size.height,
                      });
                      setResizingElement(element.id);
                    }
                  }}
                >
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
                </div>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* 다른 사용자 커서들 - 중복 제거 */}
      {Array.from(
        new Map(cursors.map((cursor) => [cursor.userId, cursor])).values()
      ).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${cursor.x * scale + offset.x}px`,
            top: `${cursor.y * scale + offset.y}px`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          />
          <div
            className="absolute top-4 left-0 px-2 py-1 bg-white rounded shadow-sm text-xs font-medium whitespace-nowrap"
            style={{ color: cursor.color }}
          >
            {formatUserName(cursor.userName)}
          </div>
        </div>
      ))}

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
        <button
          onClick={() => setScale((prev) => Math.min(2, prev * 1.2))}
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded transition-colors"
          title="줌인"
        >
          +
        </button>
        {isEditingZoom ? (
          <input
            type="number"
            min="25"
            max="200"
            value={zoomInputValue}
            onChange={(e) => setZoomInputValue(e.target.value)}
            onBlur={() => {
              const numValue = parseInt(zoomInputValue);
              if (!isNaN(numValue) && numValue >= 25 && numValue <= 200) {
                setScale(numValue / 100);
              }
              setIsEditingZoom(false);
              setZoomInputValue('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const numValue = parseInt(zoomInputValue);
                if (!isNaN(numValue) && numValue >= 25 && numValue <= 200) {
                  setScale(numValue / 100);
                }
                setIsEditingZoom(false);
                setZoomInputValue('');
              } else if (e.key === 'Escape') {
                setIsEditingZoom(false);
                setZoomInputValue('');
              }
            }}
            autoFocus
            className="w-12 h-6 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        ) : (
          <div
            className="text-xs text-center text-gray-600 px-2 cursor-pointer hover:text-gray-900 transition-colors min-w-[48px]"
            onClick={() => {
              setZoomInputValue(Math.round(scale * 100).toString());
              setIsEditingZoom(true);
            }}
            title="클릭하여 줌 레벨 입력"
          >
            {Math.round(scale * 100)}%
          </div>
        )}
        <button
          onClick={() => setScale((prev) => Math.max(0.25, prev * 0.8))}
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded transition-colors"
          title="줌아웃"
        >
          −
        </button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="삭제 확인"
        message={getDeleteMessage()}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

