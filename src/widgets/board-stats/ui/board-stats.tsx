'use client';

import { formatDate } from '@shared/lib';
import { StatCard } from '@shared/ui';
import type { Board } from '@entities/board';

interface BoardStatsProps {
  totalBoards: number;
  totalElements: number;
  recentActivity: Board | null;
  todayBoards: number;
}

export const BoardStats = ({
  totalBoards,
  totalElements,
  recentActivity,
  todayBoards,
}: BoardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
      {/* 총 보드 개수 */}
      <StatCard
        icon={
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        value={totalBoards}
        label="총 보드"
      />

      {/* 총 요소 개수 */}
      <StatCard
        icon={
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        }
        value={totalElements}
        label="총 요소"
      />

      {/* 오늘 생성된 보드 */}
      <StatCard
        icon={
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
        value={todayBoards}
        label="오늘 생성"
      />

      {/* 최근 활동 */}
      <StatCard
        icon={
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
        value={
          recentActivity ? (
            <>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                {recentActivity.name}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {formatDate(recentActivity.updatedAt)}
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">활동 없음</span>
          )
        }
        label="최근 활동"
      />
    </div>
  );
};

