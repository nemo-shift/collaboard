'use client';

import { CANVAS_GRID_SIZE } from '@features/content/lib/constants';

interface GridBackgroundProps {
  offset: { x: number; y: number };
  scale: number;
}

export const GridBackground = ({ offset, scale }: GridBackgroundProps) => {
  const gridSize = CANVAS_GRID_SIZE * scale;

  return (
    <>
      {/* 라이트 모드 그리드 */}
      <div
        className="grid-background absolute left-0 right-0 bottom-0 opacity-[0.03] dark:opacity-[0.15] pointer-events-none"
        style={{
          top: '64px',
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />
      {/* 다크 모드 그리드 */}
      <div
        className="grid-background absolute left-0 right-0 bottom-0 opacity-0 dark:opacity-[0.08] pointer-events-none"
        style={{
          top: '64px',
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />
    </>
  );
};

