'use client';

interface CursorIndicatorProps {
  name: string;
  color: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  transform?: string;
  animationDelay?: string;
  className?: string;
}

export const CursorIndicator = ({
  name,
  color,
  position,
  transform,
  animationDelay,
  className = '',
}: CursorIndicatorProps) => {
  return (
    <div className={`absolute z-50 ${className}`} style={{ ...position, transform, zIndex: 20 }}>
      <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{
            backgroundColor: color,
            ...(animationDelay && { animationDelay }),
          }}
        />
        <span className="text-xs text-gray-900 dark:text-gray-100 font-semibold">{name}</span>
      </div>
    </div>
  );
};

