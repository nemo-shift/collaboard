'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface DraggableBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface UseDraggableOptions {
  /** 초기 위치 */
  initialPosition?: { x: number; y: number };
  /** 경계 제약 */
  bounds?: DraggableBounds | (() => DraggableBounds);
  /** 드래그 시작 콜백 */
  onDragStart?: () => void;
  /** 드래그 종료 콜백 */
  onDragEnd?: (position: { x: number; y: number }) => void;
  /** 클릭 콜백 (드래그가 발생하지 않았을 때만 호출) */
  onClick?: () => void;
  /** localStorage 저장 키 (저장하지 않으려면 undefined) */
  storageKey?: string;
  /** 드래그 감지 임계값 (px) */
  dragThreshold?: number;
  /** 드래그 제외할 요소 선택자 */
  excludeSelectors?: string[];
  /** 드래그 가능 여부 */
  enabled?: boolean;
}

export interface UseDraggableReturn {
  /** 현재 위치 */
  position: { x: number; y: number };
  /** 드래그 중 여부 */
  isDragging: boolean;
  /** 드래그 핸들러 */
  dragHandlers: {
    ref: React.RefObject<HTMLDivElement | null>;
    onMouseDown: (e: React.MouseEvent) => void;
  };
  /** 위치 업데이트 (프로그래밍 방식) */
  setPosition: (pos: { x: number; y: number }) => void;
}

/**
 * 재사용 가능한 드래그 기능을 제공하는 커스텀 훅
 * 
 * @purpose
 * React 컴포넌트에 고성능 드래그 기능을 쉽게 추가할 수 있도록 하는 범용 훅입니다.
 * 협업 위젯, 포스트잇, 이미지 등 다양한 UI 요소의 드래그 기능에 재사용 가능합니다.
 * 
 * @features
 * - GPU 가속을 활용한 부드러운 드래그 (transform 사용)
 * - 드래그 중 리렌더링 최소화 (직접 DOM 조작)
 * - 경계 제약(bounds) 지원으로 화면 밖 이동 방지
 * - localStorage 자동 저장으로 위치 영속성 제공
 * - 드래그와 클릭을 자동으로 구분하여 처리
 * - 드래그 임계값 설정으로 의도치 않은 드래그 방지
 * 
 * @param {UseDraggableOptions} options - 드래그 설정 옵션
 * @param {Object} [options.initialPosition={x:0, y:0}] - 초기 위치 좌표
 * @param {DraggableBounds|Function} [options.bounds] - 드래그 가능한 영역 제약 (함수로 동적 계산 가능)
 * @param {Function} [options.onDragStart] - 드래그 시작 시 호출되는 콜백
 * @param {Function} [options.onDragEnd] - 드래그 종료 시 호출되는 콜백 (최종 위치 전달)
 * @param {Function} [options.onClick] - 클릭 시 호출되는 콜백 (드래그가 발생하지 않았을 때만)
 * @param {string} [options.storageKey] - localStorage 저장 키 (undefined면 저장 안 함)
 * @param {number} [options.dragThreshold=5] - 드래그로 간주하는 최소 이동 거리(px)
 * @param {string[]} [options.excludeSelectors=['button']] - 드래그 제외할 요소 선택자
 * @param {boolean} [options.enabled=true] - 드래그 활성화 여부
 * 
 * @returns {UseDraggableReturn} 드래그 관련 상태와 핸들러
 * @returns {Object} returns.position - 현재 위치 좌표 (React state)
 * @returns {boolean} returns.isDragging - 드래그 중 여부
 * @returns {Object} returns.dragHandlers - 드래그에 필요한 ref와 이벤트 핸들러
 * @returns {Function} returns.setPosition - 프로그래밍 방식으로 위치 업데이트
 * 
 * @constraints
 * - ref는 반드시 드래그할 DOM 요소에 연결해야 합니다
 * - bounds는 함수로 전달 시 매번 재계산되므로 성능에 주의하세요
 * - storageKey가 없으면 위치가 저장되지 않습니다
 * - excludeSelectors는 closest()로 체크하므로 중첩된 요소도 제외됩니다
 * 
 * @design
 * 성능 최적화를 위해 다음과 같이 설계했습니다:
 * 
 * 1. **transform 사용**: left/top 대신 transform을 사용하여 GPU 가속을 활용하고
 *    Reflow를 방지합니다. 이는 60fps 부드러운 드래그를 보장합니다.
 * 
 * 2. **직접 DOM 조작**: 드래그 중에는 React 상태 업데이트 없이 elementRef.current.style
 *    를 직접 조작하여 불필요한 리렌더링을 완전히 제거합니다. 드래그 종료 시에만
 *    React 상태와 동기화합니다.
 * 
 * 3. **이중 상태 관리**: position(state)와 positionRef(ref)를 함께 사용합니다.
 *    - position: React 렌더링에 필요한 상태 (드래그 종료 시만 업데이트)
 *    - positionRef: 드래그 중 실시간 위치 추적용 (리렌더링 없이 업데이트)
 * 
 * 4. **localStorage throttle**: 드래그 중에는 저장하지 않고, 종료 시에만 저장합니다.
 *    추가로 100ms debounce를 적용하여 연속 저장을 방지합니다.
 * 
 * 5. **임계값 기반 드래그 감지**: 5px 이상 이동해야 드래그로 간주하여 의도치 않은
 *    드래그를 방지하고, 클릭과 드래그를 명확히 구분합니다.
 * 
 * 6. **window 이벤트 리스너**: 요소가 아닌 window에 이벤트를 등록하여 마우스가
 *    요소 밖으로 나가도 드래그가 계속되도록 합니다.
 * 
 * @example
 * ```tsx
 * const { position, isDragging, dragHandlers } = useDraggable({
 *   initialPosition: { x: 20, y: 20 },
 *   storageKey: 'widget-position',
 *   bounds: () => ({
 *     maxX: window.innerWidth - 280,
 *     maxY: window.innerHeight - 200,
 *   }),
 *   onClick: () => setIsExpanded(true),
 * });
 * 
 * return (
 *   <div ref={dragHandlers.ref} onMouseDown={dragHandlers.onMouseDown}>
 *     드래그 가능한 요소
 *   </div>
 * );
 * ```
 */
export const useDraggable = (options: UseDraggableOptions = {}): UseDraggableReturn => {
  const {
    initialPosition = { x: 0, y: 0 },
    bounds,
    onDragStart,
    onDragEnd,
    onClick,
    storageKey,
    dragThreshold = 5,
    excludeSelectors = ['button'],
    enabled = true,
  } = options;

  // React 상태: 렌더링에 필요한 값 (드래그 종료 시에만 업데이트)
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref 상태: 드래그 중 실시간 추적용 (리렌더링 없이 업데이트)
  const dragStartRef = useRef({ x: 0, y: 0 }); // 마우스 다운 시점의 절대 좌표
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // 요소 내부에서의 마우스 오프셋
  const isDraggingRef = useRef(false); // 실제 드래그 발생 여부 (임계값 통과 여부)
  const elementRef = useRef<HTMLDivElement>(null); // 드래그할 DOM 요소 참조
  const positionRef = useRef(initialPosition); // 현재 위치 (드래그 중 실시간 업데이트)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // localStorage 저장 throttle용
  
  // 이벤트 핸들러 참조를 ref로 유지: useCallback의 의존성 변경으로 인한 참조 변경 문제 해결
  // removeEventListener가 올바른 함수를 제거할 수 있도록 항상 최신 참조 유지
  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | undefined>(undefined);
  const handleMouseUpRef = useRef<(() => void) | undefined>(undefined);

  // 마운트 시 초기 위치 설정 및 저장된 위치 복원 (클라이언트에서만)
  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const initialPos = storageKey ? (() => {
      try {
        const savedPosition = localStorage.getItem(storageKey);
        if (savedPosition) {
          const parsed = JSON.parse(savedPosition);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch (e) {
        // 잘못된 JSON 형식은 무시
      }
      return null;
    })() : null;

    const finalPosition = initialPos || initialPosition;
    positionRef.current = finalPosition;
    setPosition(finalPosition);
    elementRef.current.style.transform = `translate(${finalPosition.x}px, ${finalPosition.y}px)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // position 상태 변경 시 DOM 동기화 (드래그 중이 아닐 때만)
  useEffect(() => {
    if (elementRef.current && !isDragging) {
      positionRef.current = position;
      elementRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position, isDragging]);

  // localStorage 저장 (debounce 적용)
  // 드래그 중에는 호출되지 않으며, 종료 시에만 호출됨
  // 100ms debounce로 연속 호출 시 마지막 값만 저장하여 I/O 최적화
  const savePosition = useCallback(
    (pos: { x: number; y: number }) => {
      if (!storageKey || typeof window === 'undefined') return;
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(pos));
        } catch (e) {
          // localStorage 저장 실패 시 무시
        }
      }, 100);
    },
    [storageKey]
  );

  // 경계 값 계산
  // 함수로 전달된 경우 매번 재계산하여 동적 경계(예: 창 크기 변경) 지원
  const getBounds = useCallback((): DraggableBounds => {
    if (typeof bounds === 'function') {
      return bounds();
    }
    return bounds || {};
  }, [bounds]);

  // 경계 내로 위치 제한
  // bounds가 지정되지 않은 경우 화면 크기 기준으로 자동 계산
  // getBoundingClientRect()로 요소 크기를 가져와 화면 밖으로 나가지 않도록 보장
  const clampPosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const bounds = getBounds();
      const element = elementRef.current;
      
      if (!element) return { x, y };
      
      const rect = element.getBoundingClientRect();
      const maxX = bounds.maxX ?? window.innerWidth - rect.width;
      const maxY = bounds.maxY ?? window.innerHeight - rect.height;
      const minX = bounds.minX ?? 0;
      const minY = bounds.minY ?? 0;
      
      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      };
    },
    [getBounds]
  );

  // 드래그 중 마우스 이동 처리
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;
      if (dragStartRef.current.x === 0 && dragStartRef.current.y === 0) return;
      if (!elementRef.current) return;

      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);

      // 임계값 이상 이동했을 때만 드래그로 간주
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          setIsDragging(true);
          elementRef.current.style.transition = 'none';
          onDragStart?.();
        }

        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;
        const clamped = clampPosition(newX, newY);

        elementRef.current.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
        positionRef.current = clamped;
      }
    },
    [enabled, dragThreshold, clampPosition, onDragStart]
  );

  // 드래그 종료 처리
  const handleMouseUp = useCallback(() => {
    if (!enabled) return;
    if (dragStartRef.current.x === 0 && dragStartRef.current.y === 0) return;
    if (!elementRef.current) return;

    const wasDragging = isDraggingRef.current;

    // 이벤트 리스너 제거
    if (handleMouseMoveRef.current) {
      window.removeEventListener('mousemove', handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      window.removeEventListener('mouseup', handleMouseUpRef.current);
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setPosition(positionRef.current);
    elementRef.current.style.transition = '';

    // 드래그와 클릭 구분
    if (wasDragging) {
      onDragEnd?.(positionRef.current);
    } else {
      onClick?.();
    }

    savePosition(positionRef.current);

    // 상태 초기화
    dragStartRef.current = { x: 0, y: 0 };
    dragOffsetRef.current = { x: 0, y: 0 };
  }, [enabled, handleMouseMove, onDragEnd, onClick, savePosition, position]);
  
  // handleMouseMove와 handleMouseUp의 최신 참조를 ref에 저장
  // removeEventListener가 올바른 함수를 제거할 수 있도록
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseMove, handleMouseUp]);

  // 드래그 시작 처리
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (excludeSelectors.some((selector) => target.closest(selector))) {
        return;
      }

      if (!elementRef.current) return;

      // 드래그가 이미 진행 중이면 무시
      if (dragStartRef.current.x !== 0 || dragStartRef.current.y !== 0) {
        return;
      }

      // 초기화가 완료되지 않았다면 강제로 초기화
      const currentTransform = elementRef.current.style.transform;
      if (!currentTransform || currentTransform === 'none') {
        const finalPosition = positionRef.current;
        elementRef.current.style.transform = `translate(${finalPosition.x}px, ${finalPosition.y}px)`;
      }

      // 이전 이벤트 리스너 제거
      if (handleMouseMoveRef.current) {
        window.removeEventListener('mousemove', handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        window.removeEventListener('mouseup', handleMouseUpRef.current);
      }
      
      isDraggingRef.current = false;

      // 드래그 시작 위치와 요소 내부 오프셋 저장
      const updatedTransform = elementRef.current.style.transform;
      
      // transform에서 translate 값 파싱
      let actualX = 0;
      let actualY = 0;
      if (updatedTransform && updatedTransform !== 'none') {
        const match = updatedTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
          actualX = parseFloat(match[1]) || 0;
          actualY = parseFloat(match[2]) || 0;
        }
      }
      
      // positionRef를 우선 사용
      if (positionRef.current.x !== 0 || positionRef.current.y !== 0) {
        actualX = positionRef.current.x;
        actualY = positionRef.current.y;
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragOffsetRef.current = {
        x: e.clientX - actualX,
        y: e.clientY - actualY,
      };

      // ref에 최신 참조 저장 후 이벤트 리스너 등록
      handleMouseMoveRef.current = handleMouseMove;
      handleMouseUpRef.current = handleMouseUp;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [enabled, excludeSelectors, handleMouseMove, handleMouseUp, position]
  );

  // 언마운트 시 이벤트 리스너 정리
  // 메모리 누수 방지: window에 등록한 이벤트와 timeout을 모두 정리
  useEffect(() => {
    return () => {
      // ref에 저장된 참조 사용 (등록 시와 동일한 참조 보장)
      if (handleMouseMoveRef.current) {
        window.removeEventListener('mousemove', handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        window.removeEventListener('mouseup', handleMouseUpRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      isDraggingRef.current = false;
      dragStartRef.current = { x: 0, y: 0 };
      dragOffsetRef.current = { x: 0, y: 0 };
    };
  }, []); // 의존성 배열 비움: 언마운트 시에만 실행

  // 프로그래밍 방식으로 위치 업데이트
  // 외부에서 위치를 강제로 변경할 때 사용 (예: 리셋 버튼, 애니메이션 등)
  // React 상태, ref, DOM 모두 동기화하여 일관성 유지
  const updatePosition = useCallback((pos: { x: number; y: number }) => {
    const clamped = clampPosition(pos.x, pos.y);
    setPosition(clamped);
    positionRef.current = clamped;
    if (elementRef.current) {
      // transform만 사용하여 위치 업데이트 (left/top은 항상 0)
      elementRef.current.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
    }
    if (storageKey) {
      savePosition(clamped);
    }
  }, [clampPosition, storageKey, savePosition]);

  return {
    position,
    isDragging,
    dragHandlers: {
      ref: elementRef,
      onMouseDown: handleMouseDown,
    },
    setPosition: updatePosition,
  };
};

