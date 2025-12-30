'use client';

import { CANVAS_GRID_SIZE } from '@features/content/lib/constants';
import { useState, useEffect } from 'react';

interface GridBackgroundProps {
  offset: { x: number; y: number };
  scale: number;
}

export const GridBackground = ({ offset, scale }: GridBackgroundProps) => {
  const gridSize = CANVAS_GRID_SIZE * scale;

  // 서버와 클라이언트에서 동일한 초기값 사용 (하이드레이션 에러 방지)
  const [gridDimensions, setGridDimensions] = useState({
    gridWidth: 10000,
    gridHeight: 10000,
    gridLeft: -5000,
    gridTop: -5000,
  });

  // 클라이언트에서만 뷰포트 크기 계산
  useEffect(() => {
    const updateGridDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 뷰포트의 5배로 설정 (충분히 크게)
      const gridWidth = viewportWidth * 5;
      const gridHeight = viewportHeight * 5;
      
      // 중앙 기준으로 배치
      const gridLeft = -gridWidth / 2;
      const gridTop = -gridHeight / 2;
      
      setGridDimensions({ gridWidth, gridHeight, gridLeft, gridTop });
    };

    // 초기 설정
    updateGridDimensions();

    // 뷰포트 크기 변경 시 업데이트 (선택사항)
    window.addEventListener('resize', updateGridDimensions);
    return () => window.removeEventListener('resize', updateGridDimensions);
  }, []);

  const { gridWidth, gridHeight, gridLeft, gridTop } = gridDimensions;

  return (
    <>
      {/* 라이트 모드 그리드 */}
      <div
        className="grid-background absolute pointer-events-none opacity-[0.03] dark:opacity-[0.15]"
        style={{
          top: `calc(64px + ${gridTop}px)`,
          left: `${gridLeft}px`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          transform: `translate(${offset.x - gridLeft}px, ${offset.y - gridTop}px)`,
        }}
      />
      {/* 다크 모드 그리드 */}
      <div
        className="grid-background absolute pointer-events-none opacity-0 dark:opacity-[0.08]"
        style={{
          top: `calc(64px + ${gridTop}px)`,
          left: `${gridLeft}px`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          transform: `translate(${offset.x - gridLeft}px, ${offset.y - gridTop}px)`,
        }}
      />
    </>
  );
};

