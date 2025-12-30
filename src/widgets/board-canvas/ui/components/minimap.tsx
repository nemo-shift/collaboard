'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { BoardElement } from '@entities/element';
import { useTheme } from '@shared/lib';
import { Tooltip } from '@shared/ui';

interface MinimapProps {
  elements: BoardElement[];
  offset: { x: number; y: number };
  scale: number;
  viewportSize: { width: number; height: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
}

const MINIMAP_SIZE = 160; // 미니맵 크기 (px) - 세로 길이 줄임
const MINIMAP_PADDING = 12; // 미니맵 내부 여백

/**
 * 미니맵 컴포넌트
 * 전체 캔버스를 축소해서 보여주고, 현재 뷰포트 영역과 요소 위치를 표시
 */
export const Minimap = ({
  elements,
  offset,
  scale,
  viewportSize,
  onOffsetChange,
}: MinimapProps) => {
  const { classes } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  // 모든 요소의 경계 계산
  const bounds = useMemo(() => {
    if (elements.length === 0) {
      // 요소가 없으면 기본 크기
      return { minX: -500, minY: -500, maxX: 500, maxY: 500 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((el) => {
      minX = Math.min(minX, el.position.x);
      minY = Math.min(minY, el.position.y);
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });

    // 여백 추가
    const padding = 100;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [elements]);

  const canvasWidth = bounds.maxX - bounds.minX;
  const canvasHeight = bounds.maxY - bounds.minY;

  // 미니맵 스케일 계산 (미니맵 크기에 맞게)
  const minimapScale = useMemo(() => {
    const availableWidth = MINIMAP_SIZE - MINIMAP_PADDING * 2;
    const availableHeight = MINIMAP_SIZE - MINIMAP_PADDING * 2;
    return Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight, 1);
  }, [canvasWidth, canvasHeight]);

  // 현재 뷰포트 영역 계산 (캔버스 좌표 기준)
  const viewportRect = useMemo(() => {
    // offset은 화면 좌표이므로, 캔버스 좌표로 변환
    const canvasX = -offset.x / scale;
    const canvasY = -offset.y / scale;
    const viewportWidth = viewportSize.width / scale;
    const viewportHeight = viewportSize.height / scale;

    return {
      x: (canvasX - bounds.minX) * minimapScale,
      y: (canvasY - bounds.minY) * minimapScale,
      width: viewportWidth * minimapScale,
      height: viewportHeight * minimapScale,
    };
  }, [offset, scale, viewportSize, bounds, minimapScale]);

  // 미니맵 클릭 시 해당 위치로 이동
  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!minimapRef.current) return;

      const rect = minimapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - MINIMAP_PADDING;
      const y = e.clientY - rect.top - MINIMAP_PADDING;

      // 미니맵 좌표를 캔버스 좌표로 변환
      const canvasX = x / minimapScale + bounds.minX;
      const canvasY = y / minimapScale + bounds.minY;

      // 뷰포트 중심이 해당 위치에 오도록 offset 계산
      const newOffsetX = -(canvasX - viewportSize.width / scale / 2) * scale;
      const newOffsetY = -(canvasY - viewportSize.height / scale / 2) * scale;

      onOffsetChange({ x: newOffsetX, y: newOffsetY });
    },
    [minimapScale, bounds, viewportSize, scale, onOffsetChange]
  );

  // 미니모드 - 동그란 버튼 형태로 아이콘만 표시
  if (!isExpanded) {
    return (
      <Tooltip content="미니맵 표시">
        <div
          className={`fixed right-4 z-40 ${classes.bg} ${classes.border} rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center`}
          style={{ 
            top: 'calc(64px + var(--board-toolbar-height, 57px))',
            width: '40px',
            height: '40px',
          }}
          onClick={() => setIsExpanded(true)}
        >
        <svg
          className={`w-5 h-5 text-[var(--color-text-muted)]`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        </div>
      </Tooltip>
    );
  }

  // 확장 모드
  return (
    <div
      className={`fixed right-4 z-40 ${classes.bg} ${classes.border} rounded-lg shadow-lg p-1`}
      style={{ 
        top: 'calc(64px + var(--board-toolbar-height, 57px))',
        maxHeight: 'calc(100vh - 130px)' 
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-xs font-medium ${classes.textBody}`}>미니맵</span>
        <Tooltip content="미니맵 최소화">
          <button
            onClick={() => setIsExpanded(false)}
            className={`p-0.5 text-[var(--color-text-muted)] hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
          >
          <svg
            className="w-3.5 h-3.5"
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

      {/* 미니맵 영역 */}
      <div
        ref={minimapRef}
        className="relative cursor-pointer border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
        style={{
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
        }}
        onClick={handleMinimapClick}
      >
        {/* 캔버스 배경 */}
        <div
          className="absolute inset-0 bg-gray-100 dark:bg-gray-800"
          style={{
            transform: `translate(${MINIMAP_PADDING}px, ${MINIMAP_PADDING}px) scale(${minimapScale})`,
            transformOrigin: '0 0',
            width: canvasWidth,
            height: canvasHeight,
          }}
        />

        {/* 요소들 */}
        {elements.map((element) => {
          const elementX = (element.position.x - bounds.minX) * minimapScale;
          const elementY = (element.position.y - bounds.minY) * minimapScale;
          const elementWidth = element.size.width * minimapScale;
          const elementHeight = element.size.height * minimapScale;

          // 미니맵에서 너무 작으면 표시하지 않음
          if (elementWidth < 1 || elementHeight < 1) return null;

          return (
            <div
              key={element.id}
              className="absolute bg-blue-500/50 rounded border border-blue-600/50"
              style={{
                left: elementX + MINIMAP_PADDING,
                top: elementY + MINIMAP_PADDING,
                width: Math.max(1, elementWidth),
                height: Math.max(1, elementHeight),
              }}
            />
          );
        })}

        {/* 현재 뷰포트 영역 표시 */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: viewportRect.x + MINIMAP_PADDING,
            top: viewportRect.y + MINIMAP_PADDING,
            width: viewportRect.width,
            height: viewportRect.height,
          }}
        />
      </div>
    </div>
  );
};

