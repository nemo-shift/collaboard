'use client';

import { formatDate } from '@shared/lib';
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
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
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{totalBoards}</div>
        <div className="text-sm text-gray-600">총 보드</div>
      </div>

      {/* 총 요소 개수 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
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
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{totalElements}</div>
        <div className="text-sm text-gray-600">총 요소</div>
      </div>

      {/* 오늘 생성된 보드 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
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
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{todayBoards}</div>
        <div className="text-sm text-gray-600">오늘 생성</div>
      </div>

      {/* 최근 활동 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
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
          </div>
        </div>
        {recentActivity ? (
          <>
            <div className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
              {recentActivity.name}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(recentActivity.updatedAt)}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">활동 없음</div>
        )}
        <div className="text-sm text-gray-600 mt-2">최근 활동</div>
      </div>
    </div>
  );
};

