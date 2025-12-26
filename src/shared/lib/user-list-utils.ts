import type { CursorPosition } from '@entities/element';
import { CURRENT_USER_COLOR } from './constants';

export interface UserInfo {
  userId: string;
  userName: string | null;
  color: string;
}

/**
 * 현재 사용자와 커서 정보를 합쳐서 고유한 사용자 리스트를 생성
 * @param currentUserId - 현재 사용자 ID
 * @param currentUserName - 현재 사용자 이름
 * @param cursors - 다른 사용자들의 커서 정보
 * @returns 중복 제거된 사용자 리스트
 */
export function createUniqueUserList(
  currentUserId: string | null | undefined,
  currentUserName: string | null | undefined,
  cursors: CursorPosition[]
): UserInfo[] {
  const allUsers: UserInfo[] = [
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

  // 중복 제거 (userId 기준)
  return Array.from(
    new Map(allUsers.map((user) => [user.userId, user])).values()
  );
}

