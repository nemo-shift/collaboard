'use client';

import { useState, useEffect } from 'react';
import type { CursorPosition } from '@entities/element';
import { formatUserName, CURRENT_USER_COLOR, useDraggable } from '@shared/lib';

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

  // 클라이언트에서만 마운트 확인 (Hydration 에러 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 드래그 훅 사용 - 캔버스 좌측 상단을 초기 위치로
  const { position, isDragging, dragHandlers } = useDraggable({
    initialPosition: { x: 16, y: 16 }, // 캔버스 좌측 상단에서 약간 떨어진 위치
    storageKey: 'collaboration-widget-position',
    bounds: () => {
      // 부모 컨테이너(캔버스 영역) 기준으로 bounds 계산
      const element = dragHandlers.ref.current;
      if (element) {
        const parent = element.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          return {
            minX: 0,
            minY: 0,
            maxX: rect.width - (isExpanded ? 240 : 120),
            maxY: rect.height - (isExpanded ? 200 : 40),
          };
        }
      }
      // fallback: 화면 크기 기준 (클라이언트에서만)
      if (typeof window !== 'undefined') {
        return {
          maxX: window.innerWidth - (isExpanded ? 240 : 120),
          maxY: window.innerHeight - (isExpanded ? 200 : 40),
        };
      }
      // 서버에서는 기본값 반환
      return {
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

  // 현재 사용자 포함한 전체 사용자 리스트
  const allUsers = [
    ...(currentUserId
      ? [
          {
            userId: currentUserId,
            userName: currentUserName || null,
            color: CURRENT_USER_COLOR,
          },
        ]
      : []),
    ...cursors.map((cursor) => ({
      userId: cursor.userId,
      userName: cursor.userName,
      color: cursor.color,
    })),
  ];

  // 중복 제거
  const uniqueUsers = Array.from(
    new Map(allUsers.map((user) => [user.userId, user])).values()
  );

  // 서버에서는 렌더링하지 않음 (Hydration 에러 방지)
  if (!isMounted || uniqueUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={dragHandlers.ref}
      data-collaboration-widget
      className={`absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${isExpanded ? 'w-[240px]' : 'w-auto'}`}
      style={{
        left: 0,
        top: 0,
        // transform은 완전히 제거 - 훅이 전적으로 제어
        userSelect: 'none',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        willChange: 'transform',
      }}
      onMouseDown={dragHandlers.onMouseDown}
    >
      {/* 미니모드 */}
      {!isExpanded && (
        <div 
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
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
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {uniqueUsers.length}명 협업 중
          </span>
          {/* 아래에 더 있다는 표시 */}
          <svg
            className="w-3 h-3 text-gray-400 ml-auto"
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
        <div className="w-[240px]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
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
              <span className="text-sm font-medium text-gray-700">
                {uniqueUsers.length}명 협업 중
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="최소화"
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
          </div>

          {/* 사용자 리스트 */}
          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {uniqueUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-200"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-xs text-gray-700 font-medium truncate">
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

