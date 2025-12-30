'use client';

import { useState } from 'react';

interface ZIndexButtonGroupProps {
  onBringForward?: () => void;
  onSendBackward?: () => void;
  position?: 'top-right' | 'bottom-right';
}

/**
 * z-index 변경 버튼 그룹 컴포넌트
 * hover 상태를 독립적으로 관리하여 부모 요소의 group 클래스와 충돌하지 않음
 */
export const ZIndexButtonGroup = ({
  onBringForward,
  onSendBackward,
  position = 'top-right',
}: ZIndexButtonGroupProps) => {
  const [hoverForward, setHoverForward] = useState(false);
  const [hoverBackward, setHoverBackward] = useState(false);

  const positionClass = position === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 right-2';
  const tooltipPosition = position === 'bottom-right' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div className={`absolute ${positionClass} flex gap-1 z-50`}>
      {onBringForward && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBringForward();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseEnter={() => setHoverForward(true)}
            onMouseLeave={() => setHoverForward(false)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {hoverForward && (
            <div className={`absolute right-0 ${tooltipPosition} px-2.5 py-1.5 text-xs font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-none whitespace-nowrap z-50`}>
              앞으로 가져오기
              <span className="ml-2 text-gray-500 dark:text-gray-400 font-mono text-[10px]">Ctrl+]</span>
            </div>
          )}
        </div>
      )}
      {onSendBackward && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendBackward();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseEnter={() => setHoverBackward(true)}
            onMouseLeave={() => setHoverBackward(false)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {hoverBackward && (
            <div className={`absolute right-0 ${tooltipPosition} px-2.5 py-1.5 text-xs font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-none whitespace-nowrap z-50`}>
              뒤로 보내기
              <span className="ml-2 text-gray-500 dark:text-gray-400 font-mono text-[10px]">Ctrl+[</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

