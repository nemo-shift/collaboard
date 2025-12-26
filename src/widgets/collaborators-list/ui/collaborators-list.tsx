'use client';

import type { CursorPosition } from '@entities/element';
import { formatUserName, useTheme, createUniqueUserList } from '@shared/lib';

interface CollaboratorsListProps {
  cursors: CursorPosition[];
  currentUserId?: string;
  currentUserName?: string;
}

export const CollaboratorsList = ({
  cursors,
  currentUserId,
  currentUserName,
}: CollaboratorsListProps) => {
  const { classes } = useTheme();
  // 현재 사용자 포함한 전체 사용자 리스트 (중복 제거)
  const uniqueUsers = createUniqueUserList(currentUserId, currentUserName, cursors);

  if (uniqueUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${classes.bg} ${classes.border} rounded-lg shadow-sm`}>
      <div className="flex items-center gap-1.5">
        <svg
          className={`w-4 h-4 ${classes.textTertiary}`}
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
        <span className={`text-xs ${classes.textSecondary} font-medium`}>
          {uniqueUsers.length}명 협업 중
        </span>
      </div>
      <div className="flex items-center gap-2">
        {uniqueUsers.map((user) => (
          <div
            key={user.userId}
            className={`flex items-center gap-1.5 px-2 py-1 ${classes.bgSecondary} rounded-md ${classes.border}`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className={`text-xs ${classes.textSecondary} font-medium`}>
              {formatUserName(user.userName)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

