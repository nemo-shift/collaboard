'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BoardElement, CursorPosition, TextStyle } from '@entities/element';
import { ConfirmDialog } from '@shared/ui';
import { formatUserName, useTheme } from '@shared/lib';
import { CANVAS_GRID_SIZE } from '@features/content/lib/constants';
import { NoteElement, ImageElement, TextElement, ZoomControls, Minimap, GridBackground } from './components';
import { CANVAS_CONSTANTS } from './lib/constants';

interface BoardCanvasProps {
  boardId: string;
  elements: BoardElement[];
  cursors: CursorPosition[];
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementUpdate: (elementId: string, content: string) => void;
  onElementColorChange: (elementId: string, color: string) => void;
  onElementStyleChange?: (elementId: string, style: TextStyle) => void;
  onElementZIndexChange?: (elementId: string, zIndex: number) => void;
  onElementDelete: (elementId: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onAddImage: (position: { x: number; y: number }) => void;
  onAddText?: (position: { x: number; y: number }) => void;
  addMode?: 'note' | 'image' | 'text' | null;
  canEdit?: boolean; // 편집 가능 여부 (익명 사용자 + 비공개 보드 체크용)
  onEditBlocked?: () => void; // 편집이 차단되었을 때 호출되는 콜백
  isOwner?: boolean; // 보드 소유자 여부
  currentUserId?: string; // 현재 사용자 ID
  isModalOpen?: boolean; // 모달이 열려있는지 여부
}

export const BoardCanvas = ({
  boardId,
  elements,
  cursors,
  onElementMove,
  onElementResize,
  onElementUpdate,
  onElementColorChange,
  onElementStyleChange,
  onElementZIndexChange,
  onElementDelete,
  onAddNote,
  onAddImage,
  onAddText,
  addMode = null,
  canEdit = true,
  onEditBlocked,
  isOwner = false,
  currentUserId,
  isModalOpen = false,
}: BoardCanvasProps) => {
  const [scale, setScale] = useState(CANVAS_CONSTANTS.DEFAULT_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { classes } = useTheme();
  
  // 드래그 중 실시간 위치 추적용 ref (리렌더링 없이 업데이트)
  // 리얼타임 협업을 고려: 자신의 패닝은 ref로 관리, 드래그 종료 시에만 상태 업데이트
  const offsetRef = useRef({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const draggedElementRef = useRef<string | null>(null);
  const [elementDragStart, setElementDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const resizingElementRef = useRef<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastElementPositionRef = useRef<{ elementId: string; position: { x: number; y: number } } | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    elementId: string | null;
    elementType: 'note' | 'image' | 'text' | null;
  }>({
    isOpen: false,
    elementId: null,
    elementType: null,
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // zIndex로 정렬된 요소들 (낮은 값이 먼저 렌더링되어 뒤에 위치)
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => {
      const aZIndex = a.zIndex ?? 0;
      const bZIndex = b.zIndex ?? 0;
      return aZIndex - bZIndex;
    });
  }, [elements]);

  // z-index 변경 핸들러
  const handleBringForward = useCallback((elementId: string) => {
    if (!onElementZIndexChange) return;
    
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    // 현재 zIndex 또는 0
    const currentZIndex = element.zIndex ?? 0;
    
    // 같은 zIndex를 가진 요소들 중 가장 높은 값 찾기
    const maxZIndex = Math.max(...elements.map((el) => el.zIndex ?? 0));
    
    // 최대값보다 1 크게 설정
    onElementZIndexChange(elementId, maxZIndex + 1);
  }, [elements, onElementZIndexChange]);

  const handleSendBackward = useCallback((elementId: string) => {
    if (!onElementZIndexChange) return;
    
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    // 현재 zIndex 또는 0
    const currentZIndex = element.zIndex ?? 0;
    
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

  // 뷰포트 크기 추적
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // boardId가 변경될 때 offset과 scale 초기화
  useEffect(() => {
    const initialOffset = { x: 0, y: 0 };
    setOffset(initialOffset);
    offsetRef.current = initialOffset;
    setScale(CANVAS_CONSTANTS.DEFAULT_SCALE);
    
    // DOM도 초기화
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.transform = `translate(0px, 0px)`;
    }
  }, [boardId]);
  
  // offset 상태 변경 시 ref와 DOM 동기화 (리얼타임 업데이트 대응)
  // 다른 사용자의 패닝이 리얼타임으로 업데이트될 때 사용
  useEffect(() => {
    offsetRef.current = offset;
    if (canvasContainerRef.current && !isDragging && !draggedElement && !resizingElement) {
      // 자신이 드래그 중이 아니고 요소도 드래그 중이 아닐 때만 DOM 업데이트 (다른 사용자의 패닝 반영)
      // scale도 함께 적용
      canvasContainerRef.current.style.transform = 
        `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
      
      // 그리드 배경도 함께 업데이트
      const gridBackgrounds = document.querySelectorAll('.grid-background');
      gridBackgrounds.forEach((grid) => {
        (grid as HTMLElement).style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      });
    }
    
    // 커서 동기화를 위한 scale과 offset 브로드캐스트
    const event = new CustomEvent('board-canvas-update', {
      detail: { scale, offset },
    });
    window.dispatchEvent(event);
  }, [offset, isDragging, scale, draggedElement, resizingElement]);

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

  // 캔버스 드래그 (패닝) - 일반 드래그 또는 미들버튼
  // 리얼타임 협업 최적화: 드래그 중에는 직접 DOM 조작, 종료 시에만 상태 업데이트
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 협업 위젯 클릭은 무시 (위젯 드래그와 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.closest('[data-collaboration-widget]')) {
      return;
    }
    
    // 요소, 버튼, 툴바 등을 클릭한 경우는 패닝하지 않음
    if (
      target.closest('[data-element-id]') ||      // 요소 클릭 제외
      target.closest('button') ||                 // 버튼 클릭 제외
      target.closest('[data-text-toolbar]') ||    // 텍스트 툴바 제외
      target.closest('[data-color-picker]') ||    // 색상 선택기 제외
      target.closest('.color-picker-popup') ||    // 색상 팝업 제외
      target.closest('[data-text-element-display]') // 텍스트 요소 표시 영역 제외
    ) {
      return; // 요소 드래그가 처리되도록 함
    }
    
    // 빈 공간 감지: 요소가 없고, 버튼이 아니고, 툴바가 아닌 경우
    const isElement = target.closest('[data-element-id]');
    const isButton = target.closest('button');
    const isToolbar = target.closest('[data-text-toolbar]');
    const isColorPicker = target.closest('[data-color-picker]') || target.closest('.color-picker-popup');
    const isGridBackground = target.closest('.grid-background');
    const isCanvas = target === canvasRef.current;
    
    // 빈 공간에서만 패닝 가능
    // 미들버튼 또는 일반 드래그(왼쪽 클릭) 허용
    if ((isCanvas || isGridBackground || (!isElement && !isButton && !isToolbar && !isColorPicker))) {
      if (e.button === 1 || e.button === 0) {
        e.preventDefault(); // 기본 동작 방지
        setIsDragging(true);
        // offsetRef를 사용하여 현재 위치 기준으로 드래그 시작
        setDragStart({ 
          x: e.clientX - offsetRef.current.x, 
          y: e.clientY - offsetRef.current.y 
        });
      }
    }
  }, []);

  // draggedElement와 resizingElement를 ref로 동기화
  useEffect(() => {
    draggedElementRef.current = draggedElement;
  }, [draggedElement]);

  useEffect(() => {
    resizingElementRef.current = resizingElement;
  }, [resizingElement]);

  // 패닝을 위한 window 레벨 마우스 이벤트 처리
  // 캔버스 밖으로 마우스가 나가도 패닝이 계속 작동하도록 window에 이벤트 리스너 등록
  useEffect(() => {
    // 요소 드래그나 리사이즈 중에는 패닝 이벤트 리스너를 등록하지 않음
    // ref로 최신 값을 확인하여 클로저 문제 해결
    if (isDragging && !draggedElementRef.current && !resizingElementRef.current) {
      const handleWindowMouseMove = (e: MouseEvent) => {
        // 요소 드래그나 리사이즈가 시작되면 패닝 중단 (ref로 최신 값 확인)
        if (draggedElementRef.current || resizingElementRef.current) {
      return;
    }
    
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
        
        // 그리드 배경도 함께 업데이트
        const gridBackgrounds = document.querySelectorAll('.grid-background');
        gridBackgrounds.forEach((grid) => {
          (grid as HTMLElement).style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`;
        });
      };

      const handleWindowMouseUp = () => {
        // 요소 드래그나 리사이즈 중이면 무시 (ref로 최신 값 확인)
        if (draggedElementRef.current || resizingElementRef.current) {
          return;
        }
        
        // offsetRef의 최종 값을 상태로 동기화 (드래그 종료 시 1회만 리렌더링)
        setOffset(offsetRef.current);
        setIsDragging(false);
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    } else if (!isDragging) {
      // 패닝이 종료되면 그리드 배경을 상태와 동기화
      const gridBackgrounds = document.querySelectorAll('.grid-background');
      gridBackgrounds.forEach((grid) => {
        (grid as HTMLElement).style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      });
    }
    // 의존성 배열을 일관되게 유지 (항상 동일한 크기)
  }, [isDragging, dragStart, scale, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 협업 위젯 위에서는 캔버스 마우스 이벤트 무시 (위젯 드래그와 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.closest('[data-collaboration-widget]')) {
      return;
    }
    
    // 패닝은 window 레벨 이벤트로 처리하므로 여기서는 요소 드래그와 리사이즈만 처리
    if (draggedElement && elementDragStart) {
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
  }, [scale, draggedElement, elementDragStart, resizingElement, resizeStart, onElementMove, onElementResize]);

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

  // 줌 (스크롤로 줌인/줌아웃 제거 - 클릭 버튼과 숫자 입력으로만 제어)
  // const handleWheel = useCallback((e: React.WheelEvent) => {
  //   e.preventDefault();
  //   const delta = e.deltaY > 0 ? 0.9 : 1.1;
  //   setScale((prev) => Math.max(0.25, Math.min(2, prev * delta)));
  // }, []);

  // 클릭으로 포스트잇/이미지 추가 (addMode에 따라)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (addMode && !draggedElement && !resizingElement) {
      // canvasContainerRef를 사용하여 실제 요소 컨테이너 기준으로 위치 계산
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();
      if (containerRect) {
        // 요소 컨테이너 기준으로 클릭 위치 계산
        // offsetRef는 이미 transform에 포함되어 있으므로, 컨테이너의 실제 화면 위치에서 계산
        const x = (e.clientX - containerRect.left) / scale;
        const y = (e.clientY - containerRect.top) / scale;
        
        if (addMode === 'note') {
          onAddNote({ x, y });
        } else if (addMode === 'image') {
          onAddImage({ x, y });
        } else if (addMode === 'text' && onAddText) {
          onAddText({ x, y });
        }
      }
    }
  }, [addMode, scale, onAddNote, onAddImage, onAddText, draggedElement, resizingElement]);

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

  // 리사이즈 핸들 시작 핸들러 (공통 로직)
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, elementSize: { width: number; height: number }) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setResizeStart({
        x: (e.clientX - rect.left - offsetRef.current.x) / scale,
        y: (e.clientY - rect.top - offsetRef.current.y) / scale,
        width: elementSize.width,
        height: elementSize.height,
      });
      setResizingElement(elementId);
    }
  }, [scale]);

  // 요소 드래그 시작 핸들러 (공통 로직)
  const handleElementDragStart = useCallback((e: React.MouseEvent, elementId: string, elementPosition: { x: number; y: number }) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left - offsetRef.current.x) / scale;
      const mouseY = (e.clientY - rect.top - offsetRef.current.y) / scale;
      setElementDragStart({
        x: mouseX - elementPosition.x,
        y: mouseY - elementPosition.y,
      });
      setDraggedElement(elementId);
      lastElementPositionRef.current = null;
    }
  }, [scale]);

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
  }, [selectedElement, editingElement]);

  // ESC로 편집 취소, Delete 키로 요소 삭제 (Backspace는 제거)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC로 편집 취소 (편집 모드일 때만)
      if (e.key === 'Escape' && editingElement) {
        const element = elements.find((el) => el.id === editingElement);
        if (element?.type === 'note' || element?.type === 'text') {
          setEditingElement(null);
          setEditContent('');
        }
        return;
      }
      
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
  }, [deleteConfirm.elementId, deleteConfirm.elementType, editingElement, selectedElement, onElementDelete]);

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
    } else if (deleteConfirm.elementType === 'text') {
      return '정말 이 텍스트를 삭제하시겠습니까?';
    }
    return '정말 이 요소를 삭제하시겠습니까?';
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full ${classes.bg} overflow-hidden cursor-grab active:cursor-grabbing`}
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
        
        // 빈 공간 클릭 시 선택 해제 및 편집 모드 종료 (요소가 아닌 곳 클릭)
        if (
          target === canvasRef.current ||
          target.closest('.grid-background') ||
          (!target.closest('[data-element-id]') && !target.closest('button') && !target.closest('[data-color-picker]') && !target.closest('.color-picker-popup') && !target.closest('[data-text-toolbar]'))
        ) {
          setSelectedElement(null);
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
        // addMode일 때 요소 추가
        handleClick(e);
      }}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: addMode === 'note' || addMode === 'image' || addMode === 'text' ? 'crosshair' : 'grab' }}
    >
      {/* 그리드 배경 */}
      <GridBackground offset={offset} scale={scale} />

      {/* 요소들 - 리얼타임 협업 최적화: transform으로 GPU 가속 */}
      <div
        ref={canvasContainerRef}
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: 'calc(64px + var(--board-toolbar-height, 57px))',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: isDragging ? 'transform' : 'auto', // 드래그 중 GPU 가속 힌트
        }}
      >
        {sortedElements.map((element) => {
          const isEditing = editingElement === element.id;
          const isSelected = selectedElement === element.id;

          return (
            <div
              key={element.id}
              data-element-id={element.id}
              className="absolute cursor-move select-none group"
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                // 텍스트 요소는 width를 auto로 설정하여 내용에 맞게 늘어나도록 함
                width: element.type === 'text' ? 'auto' : `${element.size.width}px`,
                height: `${element.size.height}px`,
                // 텍스트 요소는 maxWidth를 80vw로 제한
                ...(element.type === 'text' && { maxWidth: '80vw' }),
              }}
              onClick={(e) => {
                // 삭제 버튼이나 색상 선택기, 텍스트 툴바 클릭은 무시
                const target = e.target as HTMLElement;
                const isContentEditable = target.closest('[contenteditable="true"]');
                
                // TextElement 내부 클릭 감지 (비편집 모드)
                // 포맷팅된 텍스트(<b>, <i> 등)에서도 정상 작동하도록 개선
                if (element.type === 'text' && !isEditing) {
                  // 방법 1: closest로 [data-text-element-display] 찾기
                  const textElementDisplay = target.closest('[data-text-element-display]');
                  if (textElementDisplay) {
                    // TextElement의 onClick이 먼저 실행되도록 stopPropagation을 호출하지 않음
                    // TextElement 내부에서 처리하도록 함
                    return;
                  }
                  
                  // 방법 2: 포맷팅된 태그에서 closest가 실패할 경우를 대비
                  // 요소 wrapper 내부에 [data-text-element-display]가 있고 그 안에 target이 있는지 확인
                  const elementWrapper = e.currentTarget as HTMLElement;
                  const displayDiv = elementWrapper.querySelector('[data-text-element-display]');
                  if (displayDiv && displayDiv.contains(target)) {
                    // TextElement 내부 클릭이므로 TextElement가 처리하도록 함
                    return;
                  }
                }
                
                if (target.closest('button[title="삭제 (Delete 키)"]') || 
                    target.closest('button[title="앞으로 가져오기 (Ctrl+])"]') ||
                    target.closest('button[title="뒤로 보내기 (Ctrl+[)"]') ||
                    target.closest('[data-color-picker]') ||
                    target.closest('.color-picker-popup') ||
                    target.closest('[data-text-toolbar]') ||
                    // 편집 모드일 때 contentEditable 내부 클릭은 무시
                    (isEditing && isContentEditable)) {
                  return;
                }
                
                if (!isEditing && !resizingElement) {
                  e.stopPropagation();
                  // 클릭 시 선택/해제 토글 (편집 모드는 더블클릭으로만 진입)
                  handleElementSelect(element.id);
                }
              }}
              onMouseDown={(e) => {
                // 리사이즈 핸들 클릭 체크
                const target = e.target as HTMLElement;
                if (target.classList.contains('resize-handle')) {
                  handleResizeStart(e, element.id, element.size);
                  return;
                }
                
                // 편집 중이면 드래그 방지
                if (isEditing) {
                  e.stopPropagation();
                  return;
                }
                
                // 텍스트 요소는 text-element.tsx의 onDragStart에서 처리
                // 여기서는 다른 요소들만 처리
                if (element.type === 'text') {
                  // text-element.tsx의 onDragStart가 처리하도록 함
                  return;
                }
                
                // 요소 드래그 시작 (note, image)
                handleElementDragStart(e, element.id, element.position);
              }}
            >
              {element.type === 'note' ? (
                <NoteElement
                  element={element}
                  isEditing={isEditing}
                  editContent={editContent}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  scale={scale}
                  onEditContentChange={setEditContent}
                  onEditComplete={handleEditComplete}
                  onColorChange={(color) => onElementColorChange(element.id, color)}
                  onDelete={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      elementId: element.id,
                      elementType: 'note',
                    });
                  }}
                  onResizeStart={(e) => handleResizeStart(e, element.id, element.size)}
                  onBringForward={onElementZIndexChange ? () => handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange ? () => handleSendBackward(element.id) : undefined}
                  textareaRef={textareaRef}
                />
              ) : element.type === 'text' ? (
                <TextElement
                  element={element}
                  isEditing={isEditing}
                  editContent={editContent}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  scale={scale}
                  onEditContentChange={setEditContent}
                  onEditComplete={handleEditComplete}
                  onStyleChange={(style) => {
                    if (onElementStyleChange) {
                      onElementStyleChange(element.id, style);
                    }
                  }}
                  onDelete={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      elementId: element.id,
                      elementType: 'text',
                    });
                  }}
                  onDragStart={(e) => handleElementDragStart(e, element.id, element.position)}
                  contentEditableRef={contentEditableRef}
                  onDoubleClick={handleDoubleClick}
                  onSelect={handleElementSelect}
                  onBringForward={onElementZIndexChange ? () => handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange ? () => handleSendBackward(element.id) : undefined}
                />
              ) : (
                <ImageElement
                  element={element}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  onDelete={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      elementId: element.id,
                      elementType: 'image',
                    });
                  }}
                  onResizeStart={(e) => handleResizeStart(e, element.id, element.size)}
                  onBringForward={onElementZIndexChange ? () => handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange ? () => handleSendBackward(element.id) : undefined}
                />
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
            className={`absolute top-4 left-0 px-2 py-1 ${classes.bg} rounded shadow-sm text-xs font-medium whitespace-nowrap`}
            style={{ color: cursor.color }}
          >
            {formatUserName(cursor.userName)}
          </div>
        </div>
      ))}

      {/* 줌 컨트롤 */}
      <ZoomControls scale={scale} onScaleChange={setScale} />

      {/* 미니맵 */}
      {!isModalOpen && viewportSize.width > 0 && viewportSize.height > 0 && (
        <Minimap
          elements={elements}
          offset={offset}
          scale={scale}
          viewportSize={viewportSize}
          onOffsetChange={(newOffset) => {
            setOffset(newOffset);
            offsetRef.current = newOffset;
            // DOM도 즉시 업데이트
            if (canvasContainerRef.current) {
              canvasContainerRef.current.style.transform = 
                `translate(${newOffset.x}px, ${newOffset.y}px) scale(${scale})`;
            }
            // 그리드 배경도 업데이트
            const gridBackgrounds = document.querySelectorAll('.grid-background');
            gridBackgrounds.forEach((grid) => {
              (grid as HTMLElement).style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`;
            });
          }}
        />
      )}

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

