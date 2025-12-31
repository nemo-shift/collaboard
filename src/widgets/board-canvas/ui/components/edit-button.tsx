'use client';

import { useTheme } from '@shared/lib';

interface EditButtonProps {
  onEdit: () => void;
  position?: 'top-right' | 'bottom-right';
}

/**
 * 편집 버튼 컴포넌트 (모바일 친화적)
 */
export const EditButton = ({
  onEdit,
  position = 'top-right',
}: EditButtonProps) => {
  const { classes } = useTheme();
  const positionClass = position === 'bottom-right' ? 'bottom-2 left-2' : 'top-2 left-2';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      className={`absolute ${positionClass} z-50 w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md ${classes.bg} ${classes.border} shadow-sm hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-gray-700`}
      aria-label="편집"
    >
      <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
};

