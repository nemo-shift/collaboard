'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { CursorPosition } from '@entities/element';
import { formatUserName, useDraggable, useTheme, createUniqueUserList, logger } from '@shared/lib';
import { Tooltip } from '@shared/ui';

interface CollaborationWidgetProps {
  cursors: CursorPosition[];
  currentUserId?: string;
  currentUserName?: string;
}

export const CollaborationWidget = ({
  cursors,
  currentUserId,
  currentUserName,
}: CollaborationWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { classes } = useTheme();

  // 클라이언트에서만 마운트 확인 (Hydration 에러 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 모바일 감지 (640px 미만 = Tailwind sm 브레이크포인트)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 보드 툴바 높이를 상태로 관리 (CSS 변수 변경 감지)
  const [initialY, setInitialY] = useState(() => {
    if (typeof window !== 'undefined') {
      const toolbarHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
      ) || 57;
      return toolbarHeight;
    }
    return 0;
  });

  // CSS 변수 변경 감지 및 initialY 업데이트
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInitialY = () => {
      const toolbarHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
      ) || 57;
      
      // 값이 실제로 변경될 때만 업데이트 및 로그 출력
      setInitialY((prev) => {
        if (prev !== toolbarHeight) {
          return toolbarHeight;
        }
        return prev;
      });
    };

    // 초기 업데이트
    updateInitialY();

    // ResizeObserver로 CSS 변수 변경 감지
    const observer = new MutationObserver(() => {
      updateInitialY();
    });

    // document.documentElement의 style 속성 변경 감지
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // 주기적으로 체크 (간격을 늘려서 로그 감소)
    const intervalId = setInterval(updateInitialY, 500);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  // PC 버전에서만 툴바 높이만큼 더 아래로 초기 위치 설정 (약간의 여유 공간 추가)
  // 초기 위치만 조정하고, 드래그는 캔버스 전체에서 가능하도록 함
  const initialYWithOffset = isMobile ? initialY : initialY + 30;

  const { position, isDragging, dragHandlers, setPosition } = useDraggable({
    initialPosition: { x: 16, y: initialYWithOffset }, // 초기 위치만 툴바 아래로
    storageKey: 'collaboration-widget-position',
    enabled: !isMobile, // 모바일에서는 드래그 비활성화
    bounds: () => {
      // 부모 컨테이너(캔버스 영역) 기준으로 bounds 계산
      const element = dragHandlers.ref.current;
      // 드래그는 보드 툴바 아래 캔버스 영역에서만 가능
      if (element) {
        const parent = element.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          return {
            minX: 0,
            minY: initialY, // 보드 툴바 높이만큼 아래에서부터 드래그 가능
            maxX: rect.width - (isExpanded ? 200 : 120),
            maxY: rect.height - (isExpanded ? 200 : 40),
          };
        }
      }
      // fallback: 화면 크기 기준 (클라이언트에서만)
      if (typeof window !== 'undefined') {
        const toolbarHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
        ) || 57;
        return {
          minX: 0,
          minY: 64 + toolbarHeight, // 헤더(64px) + 보드 툴바 높이
          maxX: window.innerWidth - (isExpanded ? 200 : 120),
          maxY: window.innerHeight - (isExpanded ? 200 : 40),
        };
      }
      // 서버에서는 기본값 반환
      return {
        minX: 0,
        minY: 121, // 64 + 57 (기본값)
        maxX: 1000,
        maxY: 1000,
      };
    },
    onClick: () => {
      // 클릭 시 미니모드 확장
      if (!isExpanded) {
        setIsExpanded(true);
      }
    },
    excludeSelectors: ['button'],
  });

  // 협업 위젯 초기 위치를 보드 툴바 아래로 설정 (한 번만 실행)
  // localStorage에 저장된 위치가 없거나, 저장된 위치가 보드 툴바 위에 있으면 보드 툴바 아래로 이동
  const hasSetInitialPosition = useRef(false);
  const setPositionRef = useRef(setPosition);
  
  // setPosition ref를 항상 최신으로 유지
  useEffect(() => {
    setPositionRef.current = setPosition;
  }, [setPosition]);
  
  // initialY가 변경될 때마다 위치를 올바르게 설정
  // useDraggable이 localStorage에서 위치를 불러온 후에도 initialY가 업데이트되면 재설정
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted && initialY > 50 && !isMobile) {
      // PC 버전에서만 실행, initialY가 유효한 값(50 이상)일 때만 실행
      // 보드 툴바가 마운트되고 높이가 설정된 후에 실행되도록 함
      const timeoutId = setTimeout(() => {
        // 실제 DOM의 transform 값을 확인
        const element = dragHandlers.ref.current;
        let actualY = 0;
        let actualX = 16;
        
        if (element) {
          const transform = element.style.transform;
          if (transform) {
            // transform: translate(16px, 71px) 형식에서 X, Y 값 추출
            const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            if (match) {
              actualX = parseFloat(match[1]) || 16;
              actualY = parseFloat(match[2]) || 0;
            }
          }
        }
        
        // localStorage에서 불러온 위치가 없거나, 초기 위치보다 위에 있으면 초기 위치로 설정
        // (한 번만 실행, 이후 드래그는 자유롭게 가능)
        if (actualY < initialYWithOffset && actualY < initialY) {
          const newPosition = { x: actualX || 16, y: initialYWithOffset };
          setPositionRef.current(newPosition);
        }
      }, 200); // useDraggable의 useEffect와 보드 툴바 마운트를 고려한 지연

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, initialY, isMobile, initialYWithOffset]); // position을 dependency에서 제거하여 무한 루프 방지

  // 현재 사용자 포함한 전체 사용자 리스트 (중복 제거)
  const uniqueUsers = createUniqueUserList(currentUserId, currentUserName, cursors);

  // 서버에서는 렌더링하지 않음 (Hydration 에러 방지)
  if (!isMounted || uniqueUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={isMobile ? null : dragHandlers.ref}
      data-collaboration-widget
      className={`z-40 ${classes.bg} ${classes.border} ${isExpanded ? 'rounded-xl' : 'rounded-lg'} shadow-lg ${
        isMobile 
          ? 'fixed left-4' // 모바일: 고정 위치
          : `absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}` // 데스크톱: 드래그 가능
      } ${isExpanded ? 'w-[200px] sm:w-[200px]' : 'w-auto'}`}
      style={{
        left: isMobile ? '16px' : 0,
        top: isMobile 
          ? `calc(64px + var(--board-toolbar-height, 57px) + var(--mobile-banner-height, 0px))` 
          : 0,
        transform: isMobile 
          ? 'none' 
          : undefined, // 데스크톱에서는 useDraggable이 제어
        userSelect: 'none',
        transition: isMobile || !isDragging ? 'transform 0.2s ease-out' : 'none',
        willChange: isMobile ? 'auto' : 'transform',
      }}
      onMouseDown={(e) => {
        // 모바일에서는 드래그 비활성화
        if (isMobile) {
          // 클릭 시 확장만 처리
          if (!isExpanded) {
            setIsExpanded(true);
          }
          return;
        }
        // 마우스다운 시 현재 위치가 bounds 밖이면 자동으로 캔버스 안으로 이동
        const element = dragHandlers.ref.current;
        if (element) {
          const boundsFn = () => {
            const parent = element.parentElement;
            // 드래그는 보드 툴바 아래 캔버스 영역에서만 가능
            if (parent) {
              const rect = parent.getBoundingClientRect();
              return {
                minX: 0,
                minY: initialY, // 보드 툴바 높이만큼 아래에서부터 드래그 가능
                maxX: rect.width - (isExpanded ? 200 : 120),
                maxY: rect.height - (isExpanded ? 200 : 40),
              };
            }
            return {
              minX: 0,
              minY: initialY, // 보드 툴바 높이만큼 아래에서부터 드래그 가능
              maxX: 1000,
              maxY: 1000,
            };
          };
          
          const bounds = boundsFn();
          const { minX = 0, minY: boundsMinY = 0, maxX, maxY } = bounds;
          
          // 현재 위치가 bounds 밖이면 자동으로 캔버스 안으로 이동
          let newX = position.x;
          let newY = position.y;
          let needsReposition = false;
          
          if (newX < minX) {
            newX = minX;
            needsReposition = true;
          } else if (maxX !== undefined && newX > maxX) {
            newX = maxX;
            needsReposition = true;
          }
          
          if (newY < boundsMinY) {
            newY = boundsMinY;
            needsReposition = true;
          } else if (maxY !== undefined && newY > maxY) {
            newY = maxY;
            needsReposition = true;
          }
          
          if (needsReposition) {
            setPositionRef.current({ x: newX, y: newY });
          }
        }
        
        // 기본 드래그 핸들러 호출 (데스크톱에서만)
        dragHandlers.onMouseDown(e);
      }}
      onTouchStart={(e) => {
        // 모바일에서는 터치 드래그 비활성화
        if (isMobile) {
          e.stopPropagation();
          // 클릭 시 확장만 처리
          if (!isExpanded) {
            setIsExpanded(true);
          }
        }
      }}
    >
      {/* 미니모드 */}
      {!isExpanded && (
        <div 
          className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
        >
          <svg
            className={`w-4 h-4 ${classes.textMuted}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className={`text-xs ${classes.textMuted} font-medium whitespace-nowrap`}>
            {uniqueUsers.length}명 협업 중
          </span>
          {/* 아래에 더 있다는 표시 */}
          <svg
            className={`w-3 h-3 ${classes.textMuted} ml-auto`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}

      {/* 확장 모드 */}
      {isExpanded && (
        <div className="w-[200px] sm:w-[200px]">
          {/* 헤더 */}
          <div className={`flex items-center justify-between px-3 py-2 border-b rounded-t-xl ${classes.border} ${classes.bg}`}>
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${classes.textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className={`text-sm font-medium ${classes.textMuted}`}>
                {uniqueUsers.length}명 협업 중
              </span>
            </div>
            <Tooltip content="최소화">
              <button
                onClick={() => setIsExpanded(false)}
                className={`p-1 ${classes.textMuted} hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* 사용자 리스트 */}
          <div className={`p-3 space-y-2 max-h-48 overflow-y-auto rounded-b-xl ${classes.bg}`}>
            {uniqueUsers.map((user) => (
              <div
                key={user.userId}
                className={`flex items-center gap-2 px-2 py-1.5 ${classes.bgSurfaceSubtle} rounded-md ${classes.border}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                />
                <span className={`text-xs ${classes.textMuted} font-medium truncate`}>
                  {formatUserName(user.userName)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

