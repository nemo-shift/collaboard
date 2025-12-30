'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { CANVAS_CONSTANTS } from '../ui/lib/constants';

interface UseCanvasPanningProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  scale: number;
  boardId: string;
  draggedElementRef?: RefObject<string | null>;
  resizingElementRef?: RefObject<string | null>;
  getDraggedElementRef?: () => RefObject<string | null> | undefined;
  getResizingElementRef?: () => RefObject<string | null> | undefined;
}

// getter 함수가 없으면 기본 ref 사용
const getRef = (
  getter?: () => RefObject<string | null> | undefined,
  fallback?: RefObject<string | null>
): RefObject<string | null> | undefined => {
  return getter ? getter() : fallback;
};

export const useCanvasPanning = ({
  canvasRef,
  canvasContainerRef,
  scale,
  boardId,
  draggedElementRef,
  resizingElementRef,
  getDraggedElementRef,
  getResizingElementRef,
}: UseCanvasPanningProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasPanned, setHasPanned] = useState(false); // 실제로 패닝이 발생했는지 추적 (상태로 관리)
  
  // 드래그 중 실시간 위치 추적용 ref (리렌더링 없이 업데이트)
  // 리얼타임 협업을 고려: 자신의 패닝은 ref로 관리, 드래그 종료 시에만 상태 업데이트
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false); // 즉시 확인 가능한 패닝 상태
  const hasPannedRef = useRef(false); // ref로도 관리 (내부 로직용)
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandlerRef = useRef<(() => void) | null>(null);

  // boardId가 변경될 때 offset 초기화
  useEffect(() => {
    const initialOffset = { x: 0, y: 0 };
    setOffset(initialOffset);
    offsetRef.current = initialOffset;
    
    // DOM도 초기화
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.transform = `translate(0px, 0px)`;
    }
  }, [boardId, canvasContainerRef]);

  // offset 상태 변경 시 ref와 DOM 동기화 (리얼타임 업데이트 대응)
  // 다른 사용자의 패닝이 리얼타임으로 업데이트될 때 사용
  // 패닝 중에는 이 useEffect가 실행되지 않도록 함 (handleWindowMouseMove에서 직접 DOM 조작)
  useEffect(() => {
    // offsetRef를 먼저 업데이트
    offsetRef.current = offset;
    
    // 패닝 중이 아니고, 요소 드래그/리사이즈 중이 아닐 때만 DOM 업데이트
    const currentDraggedElementRef = getRef(getDraggedElementRef, draggedElementRef);
    const currentResizingElementRef = getRef(getResizingElementRef, resizingElementRef);
    
    // isDragging이 false이고, 요소 드래그/리사이즈 중이 아닐 때만 DOM 업데이트
    // 단, 패닝이 방금 종료된 경우(isDraggingRef가 false로 바뀐 직후)는
    // handleWindowMouseMove에서 이미 최종 위치로 설정했으므로 DOM을 업데이트하지 않음
    // offsetRef.current와 offset 상태를 비교하여 이미 동기화되어 있는지 확인
    const isOffsetSynced = 
      Math.abs(offsetRef.current.x - offset.x) < 0.01 && 
      Math.abs(offsetRef.current.y - offset.y) < 0.01;
    
    if (!isDragging && !isDraggingRef.current && !currentDraggedElementRef?.current && !currentResizingElementRef?.current && !isOffsetSynced) {
      if (canvasContainerRef.current) {
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
    }
    
    // 커서 동기화를 위한 scale과 offset 브로드캐스트 (항상 실행)
    const event = new CustomEvent('board-canvas-update', {
      detail: { scale, offset },
    });
    window.dispatchEvent(event);
  }, [offset, isDragging, scale]); // 의존성 배열 최소화 (ref 관련은 제거)

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
    // stopPropagation은 제거 - 클릭만 하고 드래그하지 않은 경우 onClick이 발생하도록 함
    // 실제로 패닝이 발생했는지는 handleWindowMouseMove에서 추적
    hasPannedRef.current = false;
    setHasPanned(false);
        
        // offsetRef를 사용하여 현재 위치 기준으로 드래그 시작
        const startPos = { 
          x: e.clientX - offsetRef.current.x, 
          y: e.clientY - offsetRef.current.y 
        };
        setDragStart(startPos);
        dragStartRef.current = startPos;
        
        // ref와 상태 모두 업데이트 (ref는 즉시, 상태는 비동기)
        isDraggingRef.current = true;
        setIsDragging(true);
        
        // 즉시 window 이벤트 리스너 등록 (useEffect 대기 없이)
        // 이전 리스너가 있으면 먼저 제거 (안전장치)
        if (mouseMoveHandlerRef.current) {
          window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
        }
        if (mouseUpHandlerRef.current) {
          window.removeEventListener('mouseup', mouseUpHandlerRef.current);
        }
        
        const handleWindowMouseMove = (e: MouseEvent) => {
          // 요소 드래그나 리사이즈가 시작되면 패닝 중단 (ref로 최신 값 확인)
          const draggedRef = getRef(getDraggedElementRef, draggedElementRef);
          const resizingRef = getRef(getResizingElementRef, resizingElementRef);
          if (draggedRef?.current || resizingRef?.current || !isDraggingRef.current) {
            return;
          }
          
          // 실제로 패닝이 발생했음을 표시
          if (!hasPannedRef.current) {
            hasPannedRef.current = true;
            setHasPanned(true);
          }
          
          // 캔버스 패닝 - 리얼타임 협업 최적화
          // 드래그 중에는 직접 DOM 조작으로 리렌더링 방지 (60fps 보장)
          const newOffset = {
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
          };
          
          // ref에만 저장 (리렌더링 없음)
          offsetRef.current = newOffset;
          
          // 직접 DOM 조작 (GPU 가속 활용)
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
          const draggedRef = getRef(getDraggedElementRef, draggedElementRef);
          const resizingRef = getRef(getResizingElementRef, resizingElementRef);
          if (draggedRef?.current || resizingRef?.current) {
            return;
          }
          
          const finalOffset = { ...offsetRef.current }; // 복사본 생성
          const didPan = hasPannedRef.current; // 실제로 패닝이 발생했는지 확인
          
          // isDragging을 즉시 false로 설정
          isDraggingRef.current = false;
          setIsDragging(false);
          
          // offset 상태를 즉시 업데이트 (DOM은 이미 handleWindowMouseMove에서 설정됨)
          // useEffect에서 offsetRef.current와 offset를 비교하여 중복 업데이트를 방지
          setOffset(finalOffset);
          
          // hasPanned는 패닝이 실제로 발생했을 때만 true로 유지
          // onClick에서 확인할 수 있도록 약간의 지연 후 초기화
          // (onClick이 mouseup 직후 발생할 수 있으므로)
          if (hasPannedRef.current) {
            // 패닝이 발생했으면, onClick에서 무시할 수 있도록 유지
            // 다음 이벤트 루프에서 초기화
            setTimeout(() => {
              hasPannedRef.current = false;
              setHasPanned(false);
            }, 0);
          } else {
            // 패닝이 발생하지 않았으면 즉시 초기화
            hasPannedRef.current = false;
            setHasPanned(false);
          }
          
          // ref에 저장된 핸들러로 정확히 제거
          if (mouseMoveHandlerRef.current) {
            window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
            mouseMoveHandlerRef.current = null;
          }
          if (mouseUpHandlerRef.current) {
            window.removeEventListener('mouseup', mouseUpHandlerRef.current);
            mouseUpHandlerRef.current = null;
          }
        };

        // ref에 저장
        mouseMoveHandlerRef.current = handleWindowMouseMove;
        mouseUpHandlerRef.current = handleWindowMouseUp;

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
      }
    }
  }, [canvasRef, scale, canvasContainerRef, getDraggedElementRef, getResizingElementRef, draggedElementRef, resizingElementRef]);

  // 패닝 종료 시 그리드 배경 동기화
  useEffect(() => {
    if (!isDragging) {
      const gridBackgrounds = document.querySelectorAll('.grid-background');
      gridBackgrounds.forEach((grid) => {
        (grid as HTMLElement).style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      });
    }
  }, [isDragging, offset]);

  return {
    offset,
    setOffset,
    isDragging,
    offsetRef,
    handleMouseDown,
    hasPanned, // 상태로 반환하여 최신 값 보장
  };
};

